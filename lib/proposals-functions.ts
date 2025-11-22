// lib/proposals-functions.ts
// Funciones para manejar propuestas (proposals) según el esquema de Supabase

import type { ProposalRow, UUID } from './db-types';
import { createEvent } from './events-functions';
import { supabase } from './supabase';

export type ProposalCreateInput = {
  client_id: UUID;
  dj_id: UUID;
  monto: number;
  horas_duracion: number; // numeric
  detalles?: string;
  fecha_evento?: string; // YYYY-MM-DD
  ubicacion_evento?: string;
  generos_solicitados?: string[];
};

export type ProposalUpdateInput = {
  monto_contraoferta?: number | null;
  estado?: ProposalRow['estado'];
  estado_respuesta?: string | null;
  ronda_contrapropuesta?: number;
};

export async function createProposal(input: ProposalCreateInput): Promise<ProposalRow | null> {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        client_id: input.client_id,
        dj_id: input.dj_id,
        monto: input.monto,
        horas_duracion: input.horas_duracion,
        detalles: input.detalles ?? null,
        fecha_evento: input.fecha_evento ?? null,
        ubicacion_evento: input.ubicacion_evento ?? null,
        generos_solicitados: input.generos_solicitados ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando propuesta:', error);
      return null;
    }

    return data as ProposalRow;
  } catch (e) {
    console.error('❌ Error en createProposal:', e);
    return null;
  }
}

export async function getProposalById(id: UUID): Promise<ProposalRow | null> {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo propuesta:', error);
      return null;
    }

    return data as ProposalRow;
  } catch (e) {
    console.error('❌ Error en getProposalById:', e);
    return null;
  }
}

export async function listProposalsForUser(userId: UUID, role: 'client' | 'dj'):
  Promise<ProposalRow[]> {
  try {
    const column = role === 'client' ? 'client_id' : 'dj_id';
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq(column, userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error listando propuestas:', error);
      return [];
    }

    return (data || []) as ProposalRow[];
  } catch (e) {
    console.error('❌ Error en listProposalsForUser:', e);
    return [];
  }
}

export async function updateProposal(id: UUID, updates: ProposalUpdateInput): Promise<ProposalRow | null> {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando propuesta:', error);
      return null;
    }

    return data as ProposalRow;
  } catch (e) {
    console.error('❌ Error en updateProposal:', e);
    return null;
  }
}

export async function acceptProposal(id: UUID): Promise<ProposalRow | null> {
  // 1) Marcar propuesta como aceptada
  const updated = await updateProposal(id, { estado: 'aceptada', estado_respuesta: 'aceptada' });
  if (!updated) return null;

  try {
    // 2) Evitar duplicados: verificar si ya existe un evento para esta propuesta
    const { data: existing, error: existErr } = await supabase
      .from('events')
      .select('id')
      .eq('proposal_id', id)
      .maybeSingle();

    if (existErr) {
      console.warn('⚠️ No se pudo verificar eventos existentes para la propuesta:', existErr.message);
    }

    if (!existing) {
      // 3) Crear el evento usando datos de la propuesta
      const monto_final = updated.monto_contraoferta ?? updated.monto;
      const fecha = updated.fecha_evento || new Date().toISOString().slice(0, 10);
      const ubicacion = updated.ubicacion_evento;
      const descripcion = updated.detalles || 'Evento generado desde propuesta aceptada';

      if (!ubicacion || ubicacion.trim() === '') {
        console.warn('⚠️ Propuesta aceptada pero sin `ubicacion`. Se omite la creación automática de evento. Añade ubicación para generar evento.');
      } else {
        await createEvent({
          proposal_id: id,
          client_id: updated.client_id,
          dj_id: updated.dj_id,
          monto_final,
          fecha,
          hora_inicio: null,
          hora_fin: null,
          ubicacion,
          generos_confirmados: updated.generos_solicitados ?? null,
          descripcion,
        });
      }
    }
  } catch (e) {
    console.error('❌ Error creando evento tras aceptar propuesta:', e);
  }

  return updated;
}

export async function rejectProposal(id: UUID): Promise<ProposalRow | null> {
  return updateProposal(id, { estado: 'rechazada', estado_respuesta: 'rechazada' });
}

export async function counterOffer(id: UUID, monto_contraoferta: number, ronda_contrapropuesta?: number): Promise<ProposalRow | null> {
  return updateProposal(id, { estado: 'contraoferta', monto_contraoferta, ronda_contrapropuesta });
}
