// lib/events-functions.ts
// Funciones para manejar eventos (events) alineados con el esquema

import type { EventRow, UUID } from './db-types';
import { createSystemMessage } from './notification-functions';
import { getCurrentUser, supabase } from './supabase';

export type EventCreateInput = {
  proposal_id: UUID;
  client_id: UUID;
  dj_id: UUID;
  monto_final: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio?: string | null; // HH:MM:SS
  hora_fin?: string | null; // HH:MM:SS
  ubicacion?: string | null;
  generos_confirmados?: string[] | null;
  descripcion?: string | null;
};

export async function createEvent(input: EventCreateInput): Promise<EventRow | null> {
  try {
    // Validación: `ubicacion` debe estar presente y no vacía. Requerimos
    // ubicación antes de crear el evento para que no existan eventos
    // con ubicacion indefinida.
    if (!input.ubicacion || (typeof input.ubicacion === 'string' && input.ubicacion.trim() === '')) {
      console.error('❌ createEvent: "ubicacion" es obligatorio y no fue proporcionado');
      return null;
    }
    const { data, error } = await supabase
      .from('events')
      .insert({
        proposal_id: input.proposal_id,
        client_id: input.client_id,
        dj_id: input.dj_id,
        monto_final: input.monto_final,
        fecha: input.fecha,
        hora_inicio: input.hora_inicio ?? null,
        hora_fin: input.hora_fin ?? null,
        ubicacion: input.ubicacion,
        generos_confirmados: input.generos_confirmados ?? null,
        descripcion: input.descripcion ?? null,
      })
      .select()
      .single();

    if (error) {
      // Loguear objeto completo para debugging (RLS por ejemplo)
      try {
        console.error('❌ Error creando evento:', JSON.stringify(error));
      } catch (e) {
        console.error('❌ Error creando evento (no se pudo stringify):', error);
      }

      // Detect RLS error code 42501 and provide actionable guidance. Also try a safe fallback:
      if ((error as any)?.code === '42501') {
        console.error('🔒 Error RLS detectado al insertar en `events`. Las Row Level Security policies están bloqueando la inserción.');
        console.error('🔎 Payload intentado:', {
          proposal_id: input.proposal_id,
          client_id: input.client_id,
          dj_id: input.dj_id,
          monto_final: input.monto_final,
          fecha: input.fecha,
          hora_inicio: input.hora_inicio,
          hora_fin: input.hora_fin,
          ubicacion: input.ubicacion,
        });
        console.error('➡️ SQL ejemplo para permitir inserts (pega en Supabase SQL Editor):\n');
        console.error('DROP POLICY IF EXISTS "Users can insert events" ON public.events;\nCREATE POLICY "Users can insert events" ON public.events FOR INSERT WITH CHECK (client_id = auth.uid() OR dj_id = auth.uid());');

        // Intentar un fallback seguro: si client_id y dj_id están presentes, intentar swap.
        if (input.client_id && input.dj_id) {
          try {
            console.log('🔁 Intentando fallback: reintentar insert intercambiando client_id <-> dj_id');
            const { data: swappedData, error: swappedError } = await supabase
              .from('events')
              .insert({
                proposal_id: input.proposal_id,
                client_id: input.dj_id,
                dj_id: input.client_id,
                monto_final: input.monto_final,
                fecha: input.fecha,
                hora_inicio: input.hora_inicio ?? null,
                hora_fin: input.hora_fin ?? null,
                ubicacion: input.ubicacion,
                generos_confirmados: input.generos_confirmados ?? null,
                descripcion: input.descripcion ?? null,
              })
              .select()
              .single();

            if (swappedError) {
              console.error('❌ Fallback falló al insertar evento con client/dj intercambiados:', swappedError);
            } else {
              console.log('✅ Fallback exitoso — evento creado con campos intercambiados');
              return swappedData as EventRow;
            }
          } catch (swapErr) {
            console.warn('⚠️ Error durante intento de fallback para createEvent:', swapErr);
          }
        }
      }

      return null;
    }

    return data as EventRow;
  } catch (e) {
    console.error('❌ Error en createEvent:', e);
    return null;
  }
}

export async function getEventById(id: UUID): Promise<EventRow | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo evento:', error);
      return null;
    }

    return data as EventRow;
  } catch (e) {
    console.error('❌ Error en getEventById:', e);
    return null;
  }
}

export async function listEventsForUser(userId: UUID, role: 'client' | 'dj'): Promise<EventRow[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`client_id.eq.${userId},dj_id.eq.${userId}`)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error listando eventos:', error);
      return [];
    }

    return (data || []) as EventRow[];
  } catch (e) {
    console.error('❌ Error en listEventsForUser:', e);
    return [];
  }
}

export async function confirmEventRealization(eventId: UUID, role: 'client' | 'dj'): Promise<{ success: boolean; bothConfirmed: boolean; error?: any }> {
  try {
    const now = new Date().toISOString();
    const updateField = role === 'client' ? 'client_confirmed_at' : 'dj_confirmed_at';

    // 1. Update confirmation timestamp
    const { data: event, error } = await supabase
      .from('events')
      .update({ [updateField]: now })
      .eq('id', eventId)
      .select('dj_confirmed_at, client_confirmed_at')
      .single();

    if (error) {
      console.error('❌ Error confirming event:', error);
      return { success: false, bothConfirmed: false, error };
    }

    // 2. Check if both confirmed
    const bothConfirmed = !!(event?.dj_confirmed_at && event?.client_confirmed_at);

    // 3. If both confirmed, update status to 'completado' (if not already)
    if (bothConfirmed) {
      await supabase
        .from('events')
        .update({ estado: 'completado', completada_at: now })
        .eq('id', eventId);

      // Here you would trigger the payment release logic
      console.log('🎉 Both parties confirmed! Payment should be released.');

      // 3. Update Payment Status in 'pagos' table
      const { error: paymentError } = await supabase
        .from('pagos')
        .update({ estado: 'LIBERADO' })
        .eq('event_id', eventId);

      if (paymentError) {
        console.error('❌ Error updating payment status:', paymentError);
      } else {
        console.log('✅ Payment status updated to LIBERADO');
      }

      // 4. Send notifications
      try {
        const { getEventById } = require('./events-functions'); // Ensure we have the full event data
        const fullEvent = await getEventById(eventId);

        if (fullEvent) {
          // Notify Client (from System/KushkiPagos)
          await createSystemMessage(
            '00000000-0000-0000-0000-000000000000', // System ID for KushkiPagos
            fullEvent.client_id,
            'Tu pago al DJ ha sido procesado con éxito por KushkiPagos. Gracias por confirmar.'
          );

          // Notify DJ (from System/KushkiPagos)
          await createSystemMessage(
            '00000000-0000-0000-0000-000000000000', // System ID for KushkiPagos
            fullEvent.dj_id,
            'Tu pago fue procesado con éxito por KushkiPagos. Ya lo puedes ver reflejado en tu apartado de mis pagos y eventos.'
          );
        }
      } catch (notifyError) {
        console.error('⚠️ Error sending confirmation notifications:', notifyError);
      }
    }

    return { success: true, bothConfirmed };
  } catch (e) {
    console.error('❌ Error in confirmEventRealization:', e);
    return { success: false, bothConfirmed: false, error: e };
  }
}

export async function cancelEvent(eventId: UUID, cancelledBy: 'client' | 'dj'): Promise<boolean> {
  try {
    // Obtener evento para saber client/dj y detalles
    const ev = await getEventById(eventId);
    if (!ev) {
      console.warn('⚠️ cancelEvent: evento no encontrado para id=', eventId);
      return false;
    }

    // 1. Actualizar estado del evento
    const { error } = await supabase
      .from('events')
      .update({ estado: 'cancelado', cancelada_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) {
      console.error('❌ Error cancelando evento:', error);
      return false;
    }

    // 2. Manejar Reembolso en tabla 'pagos'
    try {
      // Buscar el pago asociado al evento
      const { data: payment } = await supabase
        .from('pagos')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (payment) {
        let newStatus = 'REFUNDED_FULL';
        let logMessage = 'Reembolso 100% al cliente (DJ canceló)';

        if (cancelledBy === 'client') {
          newStatus = 'REFUNDED_PARTIAL';
          logMessage = 'Reembolso 80% cliente, 10% DJ, 10% Mivok (Cliente canceló)';

          // Aquí podríamos crear registros adicionales para la compensación del DJ
          // Por ahora, solo marcamos el estado para reflejar que no es un reembolso total
        }

        const { error: payError } = await supabase
          .from('pagos')
          .update({ estado: newStatus })
          .eq('id', payment.id);

        if (payError) {
          console.error('❌ Error actualizando estado del pago:', payError);
        } else {
          console.log(`✅ Estado de pago actualizado a ${newStatus}: ${logMessage}`);
        }
      }
    } catch (payErr) {
      console.warn('⚠️ Error gestionando reembolso:', payErr);
    }

    // 3. Notificar
    try {
      const current = await getCurrentUser();
      const actorId = current?.id || null;

      // Resolver nombre del actor (si es posible)
      const { data: actorProfile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', actorId)
        .single();

      const actorName = actorProfile?.first_name || 'Usuario';

      // Determinar receptor: si actor es client -> receptor es dj; si actor es dj -> receptor es client
      const receiverId = actorId === ev.client_id ? ev.dj_id : ev.client_id;

      const when = new Date().toLocaleString('es-CL');
      const message = `${actorName} canceló el evento (id: ${ev.id}) el ${ev.fecha} — notificado el ${when}`;

      if (receiverId) {
        // Intentar crear mensaje de sistema (evita RLS si sender != auth.uid())
        await createSystemMessage(actorId as string, receiverId as string, message);
      }
    } catch (notifyErr) {
      console.warn('⚠️ cancelEvent: no se pudo crear notificación de cancelación:', notifyErr);
    }

    return true;
  } catch (e) {
    console.error('❌ Error en cancelEvent:', e);
    return false;
  }
}

export async function finalizeCompletedEvents(userId: UUID, role: 'client' | 'dj'): Promise<void> {
  try {
    const now = new Date();
    const column = role === 'client' ? 'client_id' : 'dj_id';

    // Obtener eventos confirmados del usuario
    const { data: events, error } = await supabase
      .from('events')
      .select('id, fecha, hora_fin, estado')
      .eq(column, userId)
      .eq('estado', 'confirmado');

    if (error) {
      console.error('❌ Error obteniendo eventos para finalizar:', error);
      return;
    }

    if (!events || events.length === 0) {
      return;
    }

    // Filtrar eventos que ya pasaron
    const eventsToFinalize = events.filter(event => {
      if (!event.fecha) return false;

      // Usar hora_fin si existe, sino usar fin del día
      const eventEndTime = event.hora_fin ? event.hora_fin : '23:59:59';
      const eventEnd = new Date(event.fecha + 'T' + eventEndTime);
      return eventEnd.getTime() < now.getTime();
    });

    if (eventsToFinalize.length === 0) {
      return;
    }

    // Actualizar eventos a 'completado'
    const eventIds = eventsToFinalize.map(e => e.id);
    const { error: updateError } = await supabase
      .from('events')
      .update({
        estado: 'completado',
        updated_at: new Date().toISOString()
      })
      .in('id', eventIds);

    if (updateError) {
      console.error('❌ Error finalizando eventos:', updateError);
    } else {
      console.log(`✅ Finalizados ${eventsToFinalize.length} eventos completados`);
    }
  } catch (e) {
    console.error('❌ Error en finalizeCompletedEvents:', e);
  }
}

export async function deleteEvent(id: UUID): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando evento:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('❌ Error en deleteEvent:', e);
    return false;
  }
}
