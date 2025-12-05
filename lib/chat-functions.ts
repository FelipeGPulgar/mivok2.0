// lib/chat-functions.ts
// Funciones para manejar chat en tiempo real con Supabase

import { createEvent } from './events-functions';
import { getCurrentUser, supabase } from './supabase';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  content_type: 'text' | 'proposal';
  metadata?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant_id: string;
  participant_name?: string;
  participant_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  last_message_sender?: string;
}

// ============================================================================
// MENSAJES - CRUD
// ============================================================================

/**
 * Enviar un mensaje a otro usuario
 */
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  contentType: 'text' | 'proposal' = 'text',
  metadata?: any
): Promise<ChatMessage | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        content_type: contentType,
        metadata: metadata || {},
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error enviando mensaje:', error);
      return null;
    }

    console.log('✅ Mensaje enviado:', data.id);
    // 🔔 Las notificaciones ahora se crean en base de datos mediante trigger
    // (see supabase/triggers.sql). No intentamos insertar desde el cliente
    // para evitar errores RLS (42501).

    return data;
  } catch (error) {
    console.error('❌ Error en sendMessage:', error);
    return null;
  }
};

/**
 * Obtener conversación entre dos usuarios (ordenada por fecha)
 */
export const getConversation = async (
  userId1: string,
  userId2: string,
  limit: number = 50
): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error obteniendo conversación:', error);
      return [];
    }

    // Invertir para mostrar orden cronológico correcto
    return (data || []).reverse();
  } catch (error) {
    console.error('❌ Error en getConversation:', error);
    return [];
  }
};

/**
 * Marcar un mensaje como leído
 */
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      console.error('❌ Error marcando mensaje como leído:', error);
      return false;
    }

    console.log('✅ Mensaje marcado como leído');
    return true;
  } catch (error) {
    console.error('❌ Error en markMessageAsRead:', error);
    return false;
  }
};

/**
 * Marcar todos los mensajes de una conversación como leídos
 */
export const markConversationAsRead = async (
  userId: string,
  otherUserId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId);

    if (error) {
      console.error('❌ Error marcando conversación como leída:', error);
      return false;
    }

    console.log('✅ Conversación marcada como leída');
    return true;
  } catch (error) {
    console.error('❌ Error en markConversationAsRead:', error);
    return false;
  }
};

// ============================================================================
// CONVERSACIONES - LISTADO
// ============================================================================

/**
 * Obtener todas las conversaciones activas de un usuario
 */
export const getActiveConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    // Obtener todos los IDs únicos de participantes
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo conversaciones:', error);
      return [];
    }

    // Procesar para obtener conversaciones únicas
    const conversationsMap = new Map<string, Conversation>();

    (data || []).forEach((msg: any) => {
      const participantId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const isSender = msg.sender_id === userId;

      if (!conversationsMap.has(participantId)) {
        conversationsMap.set(participantId, {
          id: participantId,
          participant_id: participantId,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: 0,
          last_message_sender: isSender ? 'yo' : 'otro',
        });
      }
    });

    // Obtener count de no leídos para cada conversación
    for (const [participantId, conv] of conversationsMap) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('sender_id', participantId)
        .eq('is_read', false);

      conv.unread_count = count || 0;
    }

    return Array.from(conversationsMap.values());
  } catch (error) {
    console.error('❌ Error en getActiveConversations:', error);
    return [];
  }
};

/**
 * Obtener contador de mensajes no leídos totales
 */
export const getUnreadMessagesCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Error obteniendo count de no leídos:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error en getUnreadMessagesCount:', error);
    return 0;
  }
};

/**
 * Obtener contador de mensajes no leídos con un usuario específico
 */
/**
 * Obtener todos los mensajes no leídos de un usuario
 */
export const getUnreadMessages = async (userId: string): Promise<ChatMessage[]> => {
  try {
    console.log(`🔍 Buscando mensajes no leídos para userId: ${userId}`);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error obteniendo mensajes no leídos:', error);
      return [];
    }

    console.log(`✅ Obtenidos ${data?.length || 0} mensajes no leídos para ${userId}`);
    if (data && data.length > 0) {
      console.log(`   Mensajes: ${data.map(m => `${m.id} from ${m.sender_id}`).join(', ')}`);
    }
    return data || [];
  } catch (error) {
    console.error('❌ Error en getUnreadMessages:', error);
    return [];
  }
};

export const getUnreadMessagesWithUser = async (
  userId: string,
  otherUserId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Error obteniendo count de no leídos:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error en getUnreadMessagesWithUser:', error);
    return 0;
  }
};

// ============================================================================
// REALTIME - SUSCRIPCIONES
// ============================================================================

/**
 * Suscribirse a nuevos mensajes en una conversación
 * Retorna función para desuscribirse
 */
export const subscribeToConversation = (
  userId1: string,
  userId2: string,
  callback: (message: ChatMessage) => void,
  onMessageUpdated?: (messageId: string, updatedData: any) => void
): (() => void) => {
  try {
    console.log(`🔔 Suscribiendo a mensajes entre ${userId1} y ${userId2}`);
    
    // Crear canal sin filtro - Realtime puede tener problemas con filtros complejos
    const channel = supabase
      .channel(`conversation_${userId1}_${userId2}`, {
        config: {
          broadcast: { self: true },
          presence: { key: userId1 }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const msg = payload.new;
          console.log('📨 Cambio en tabla messages detectado:', {
            id: msg.id,
            sender: msg.sender_id,
            receiver: msg.receiver_id,
            nosotros: userId1,
            otro: userId2,
          });
          
          // Filtrar manualmente para mensajes relevantes
          const esParaNosotros = (
            (msg.sender_id === userId1 && msg.receiver_id === userId2) ||
            (msg.sender_id === userId2 && msg.receiver_id === userId1)
          );
          
          if (esParaNosotros) {
            console.log('✅ Mensaje relevante, llamando callback');
            callback(msg);
          } else {
            console.log('⏭️ Mensaje ignorado (no es relevante para esta conversación)');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const msg = payload.new;
          console.log('🔄 Actualización de mensaje detectada:', {
            id: msg.id,
            sender: msg.sender_id,
            receiver: msg.receiver_id,
            proposal: msg.metadata?.proposal,
          });
          
          // Filtrar manualmente para mensajes relevantes
          const esParaNosotros = (
            (msg.sender_id === userId1 && msg.receiver_id === userId2) ||
            (msg.sender_id === userId2 && msg.receiver_id === userId1)
          );
          
          if (esParaNosotros) {
            console.log('✅ Actualización relevante, notificando');
            // Llamar al callback de actualización si existe
            if (onMessageUpdated) {
              onMessageUpdated(msg.id, {
                proposal: msg.metadata?.proposal,
                metadata: msg.metadata,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción:', status);
      });

    // Retornar función para desuscribirse
    return () => {
      console.log('🔌 Desuscribiendo de conversación...');
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('❌ Error en subscribeToConversation:', error);
    return () => {};
  }
};

/**
 * Suscribirse a cambios de estado de mensajes (leídos/no leídos)
 */
export const subscribeToMessageUpdates = (
  userId: string,
  callback: (message: ChatMessage) => void
): (() => void) => {
  try {
    const channel = supabase
      .channel(`messages_updates_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log('✅ Mensaje actualizado:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('❌ Error en subscribeToMessageUpdates:', error);
    return () => {};
  }
};

/**
 * Suscribirse a todas las conversaciones de un usuario
 */
export const subscribeToAllMessages = (
  userId: string,
  callback: (message: ChatMessage) => void
): (() => void) => {
  try {
    console.log(`🔔 Iniciando suscripción a mensajes para userId: ${userId}`);
    
    // 🔥 Crear dos suscripciones: una para mensajes recibidos y otra para enviados
    const channelReceived = supabase
      .channel(`messages_received_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log(`📨 Mensaje RECIBIDO: ${payload.new.id} from ${payload.new.sender_id}, is_read: ${payload.new.is_read}`);
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`✅ Canal mensajes_recibidos: ${status}`);
      });

    // 🔥 También suscribirse a cambios en mensajes que ENVIASTE (por si cambian is_read)
    const channelSent = supabase
      .channel(`messages_sent_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log(`� Mensaje ENVIADO: ${payload.new.id} to ${payload.new.receiver_id}`);
          // Aquí podrías actualizar el estado de mensajes enviados si lo necesitas
        }
      )
      .subscribe((status) => {
        console.log(`✅ Canal mensajes_enviados: ${status}`);
      });

    return () => {
      console.log(`🔕 Removiendo canales de suscripción para ${userId}`);
      supabase.removeChannel(channelReceived);
      supabase.removeChannel(channelSent);
    };
  } catch (error) {
    console.error('❌ Error en subscribeToAllMessages:', error);
    return () => {};
  }
};

// ============================================================================
// PROPUESTAS - RESPUESTAS
// ============================================================================

/**
 * Enviar una respuesta a una propuesta (aceptar, rechazar o contrapropuesta)
 */
export const respondToProposal = async (
  senderId: string,
  receiverId: string,
  proposalResponse: {
    estado: 'aceptada' | 'rechazada' | 'contraoferta';
    monto?: number;
    horas?: number;
    detalles?: string;
  },
  originalProposalMessageId: string
): Promise<ChatMessage | null> => {
  try {
    const responseText = 
      proposalResponse.estado === 'aceptada' 
        ? '✅ Propuesta aceptada'
        : proposalResponse.estado === 'rechazada'
        ? '❌ Propuesta rechazada'
        : '💬 Contrapropuesta enviada';

    // 1️⃣ ACTUALIZAR EL MENSAJE ORIGINAL CON EL NUEVO ESTADO
    // Primero obtener el mensaje original para preservar su metadata
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', originalProposalMessageId)
      .single();

    if (fetchError || !originalMessage) {
      console.error('❌ No se encontró el mensaje original:', fetchError);
    } else {
      // Actualizar el metadata del mensaje original con el nuevo estado
      const updatedMetadata = {
        ...originalMessage.metadata,
        proposal: {
          ...originalMessage.metadata?.proposal,
          estado: proposalResponse.estado,
        },
      };

      const { error: updateError } = await supabase
        .from('messages')
        .update({ metadata: updatedMetadata })
        .eq('id', originalProposalMessageId);

      if (updateError) {
        console.error('❌ Error actualizando mensaje original:', updateError);
      } else {
        console.log('✅ Mensaje original actualizado con nuevo estado:', proposalResponse.estado);
      }
    }

    // 2️⃣ CREAR NUEVO MENSAJE CON LA RESPUESTA
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: responseText,
        content_type: 'proposal',
        metadata: {
          proposal: proposalResponse,
          isProposalResponse: true,
          respondingToMessageId: originalProposalMessageId,
        },
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error respondiendo propuesta:', error);
      return null;
    }

    console.log('✅ Respuesta a propuesta enviada');

    // 2.5️⃣ ACTUALIZAR ESTADO EN LA TABLA PROPOSALS (CRÍTICO)
    if (originalMessage) {
      const dbProposalId = originalMessage.metadata?.proposal?.id || originalProposalMessageId;
      
      try {
        const { error: updateProposalError } = await supabase
          .from('proposals')
          .update({ 
            estado: proposalResponse.estado,
            aceptada_at: proposalResponse.estado === 'aceptada' ? new Date().toISOString() : null
          })
          .eq('id', dbProposalId);

        if (updateProposalError) {
          console.error('❌ Error actualizando estado de propuesta en DB:', updateProposalError);
        } else {
          console.log('✅ Estado de propuesta actualizado en DB:', proposalResponse.estado);
        }
      } catch (error) {
        console.error('❌ Error al actualizar propuesta:', error);
      }
    }

    // 🔔 Notificaciones: ahora se generan en la base de datos mediante trigger
    // para evitar problemas con RLS cuando el cliente no presenta el token JWT.

    // 3️⃣ Si se aceptó la propuesta, crear un evento (si es posible)
    if (proposalResponse.estado === 'aceptada' && originalMessage) {
      try {
        // Determinar el ID real de propuesta a usar en events: preferir el id de propuesta en metadata (DB id)
        const dbProposalId = originalMessage.metadata?.proposal?.id || originalProposalMessageId;

        // Verificar si ya existe un evento asociado a este proposal_id (usar el DB id cuando exista)
        const { data: existing, error: existErr } = await supabase
          .from('events')
          .select('id')
          .eq('proposal_id', dbProposalId)
          .maybeSingle();

        if (existErr) {
          console.warn('⚠️ No se pudo verificar eventos existentes para mensaje-propuesta:', existErr.message);
        }

        if (!existing) {
          // Determinar roles a partir del mensaje original:
          // Quien envió la propuesta original es el "proposer"
          const proposerId = originalMessage.sender_id;
          const recipientId = originalMessage.receiver_id;

          const metadataProposal = originalMessage.metadata?.proposal || {};
          const monto_final = Number(metadataProposal.monto) || Number(proposalResponse.monto) || 0;
          const descripcion = metadataProposal.detalles || proposalResponse.detalles || 'Evento confirmado desde chat';

          // Campos requeridos por eventos: la ubicación debe estar presente
          // en la metadata de la propuesta para crear el evento automáticamente.
          const fecha = new Date().toISOString().slice(0, 10);
          const ubicacion = (metadataProposal.ubicacion && String(metadataProposal.ubicacion).trim() !== '')
            ? metadataProposal.ubicacion
            : null;

          // Intentar leer hora_inicio/hora_fin y géneros desde la metadata de la propuesta
          const hora_inicio = metadataProposal.hora_inicio || metadataProposal.horaInicio || null;
          const hora_fin = metadataProposal.hora_fin || metadataProposal.horaFin || null;
          const generos_confirmados = metadataProposal.generos_confirmados || metadataProposal.generos_solicitados || metadataProposal.generos || null;

          // Obtener usuario autenticado actual para asegurar que uno de los campos client_id/dj_id
          // coincida con auth.uid() y así no falle RLS.
          const currentUser = await getCurrentUser();
          const currentUid = currentUser?.id || null;

          if (!currentUid) {
            console.warn('⚠️ No hay usuario autenticado en respondToProposal; se omite la creación de evento para evitar RLS');
          } else {
            // Si quien acepta es el proposer original
            let client_id = proposerId;
            let dj_id = recipientId;

            if (currentUid === proposerId) {
              // asignar al current user como client_id para que auth.uid() coincida
              client_id = proposerId;
              dj_id = recipientId;
            } else if (currentUid === recipientId) {
              // asignar al current user como client_id
              client_id = recipientId;
              dj_id = proposerId;
            } else {
              // Si por alguna razón el currentUid no coincide con ninguno, intentar mantener heurística pero garantizar que
              // currentUid sea uno de los campos para satisfacer RLS: priorizamos asignarlo como client_id.
              client_id = currentUid;
              dj_id = proposerId === currentUid ? recipientId : proposerId;
            }

            // Requerimos ubicación para crear el evento. Si no hay ubicación
            // en la metadata de la propuesta, no se crea el evento automáticamente.
            if (!ubicacion) {
              console.warn('⚠️ No se creó evento: falta la ubicación en la propuesta. Debes pedir la ubicación antes de aceptar.');

              // Marcar el mensaje original para que la UI pueda detectar que
              // falta ubicación y solicitarla al usuario (flag en metadata).
              try {
                const updatedMetadata = {
                  ...originalMessage.metadata,
                  proposal: {
                    ...originalMessage.metadata?.proposal,
                    missing_location: true,
                  },
                };

                await supabase
                  .from('messages')
                  .update({ metadata: updatedMetadata })
                  .eq('id', originalProposalMessageId);
              } catch (metaErr) {
                console.warn('⚠️ No se pudo marcar metadata de mensaje como missing_location:', metaErr);
              }
              } else {
              await createEvent({
                proposal_id: dbProposalId as unknown as string,
                client_id: client_id as string,
                dj_id: dj_id as string,
                monto_final,
                fecha,
                hora_inicio: hora_inicio,
                hora_fin: hora_fin,
                ubicacion,
                generos_confirmados: generos_confirmados,
                descripcion,
              });
            }
          }
        }
      } catch (evtErr) {
        console.error('❌ Error creando evento desde respuesta de propuesta:', evtErr);
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error en respondToProposal:', error);
    return null;
  }
};
