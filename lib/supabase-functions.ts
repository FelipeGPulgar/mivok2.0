// lib/supabase-functions.ts
// Funciones para interactuar con las tablas de Supabase

import { supabase } from './supabase';

// ============================================================================
// DJ PROFILES
// ============================================================================

export interface DJProfile {
  id: string;
  user_id: string;
  tarifa_por_hora: number;
  generos: string[];
  ubicacion: string;
  anos_en_app: number;
  eventos_realizados: number;
  calificacion: number;
  resenas_count: number;
  imagen_url: string | null;
  descripcion_largo: string | null;
  disponibilidad: any;
  is_activo: boolean;
  created_at: string;
  updated_at: string;
}

// Obtener perfil DJ por user_id
export const getDJProfile = async (userId: string): Promise<DJProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('dj_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error obteniendo perfil DJ:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('❌ Error en getDJProfile:', error);
    return null;
  }
};

// Obtener perfil de usuario por user_id
export const getUserProfile = async (userId: string): Promise<{ first_name: string; email?: string; foto_url?: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('first_name, email, foto_url')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error obteniendo perfil de usuario:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('❌ Error en getUserProfile:', error);
    return null;
  }
};

// Crear o actualizar perfil DJ
export const createOrUpdateDJProfile = async (
  userId: string,
  profileData: Partial<DJProfile>
): Promise<DJProfile | null> => {
  try {
    const { data: existingProfile } = await supabase
      .from('dj_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Actualizar
      const { data, error } = await supabase
        .from('dj_profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error actualizando DJ profile:', error);
        return null;
      }

      console.log('✅ DJ profile actualizado');
      return data;
    } else {
      // Crear
      const { data, error } = await supabase
        .from('dj_profiles')
        .insert({
          user_id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando DJ profile:', error);
        return null;
      }

      console.log('✅ DJ profile creado');
      return data;
    }
  } catch (error) {
    console.error('❌ Error en createOrUpdateDJProfile:', error);
    return null;
  }
};

// Obtener todos los DJs activos (para búsqueda)
export const getAllActiveDJs = async (): Promise<DJProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('dj_profiles')
      .select('*')
      .eq('is_activo', true)
      .order('calificacion', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo DJs:', error);
      return [];
    }

    console.log(`✅ DJs cargados de Supabase:`, data?.length, 'DJs encontrados');

    return data || [];
  } catch (error) {
    console.error('❌ Error en getAllActiveDJs:', error);
    return [];
  }
};

// Buscar DJs por género
export const searchDJsByGenres = async (genres: string[]): Promise<DJProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('dj_profiles')
      .select('*')
      .eq('is_activo', true)
      .contains('generos', genres)
      .order('calificacion', { ascending: false });

    if (error) {
      console.error('❌ Error buscando DJs por género:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en searchDJsByGenres:', error);
    return [];
  }
};

// ============================================================================
// MESSAGES (CHAT)
// ============================================================================

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  content_type: string;
  metadata: any;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// Obtener mensajes entre dos usuarios
export const getConversation = async (
  userId1: string,
  userId2: string,
  limit: number = 50
): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error obteniendo conversación:', error);
      return [];
    }

    return (data || []).reverse();
  } catch (error) {
    console.error('❌ Error en getConversation:', error);
    return [];
  }
};

// Enviar mensaje
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  contentType: string = 'text',
  metadata: any = null
): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        content_type: contentType,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error enviando mensaje:', error);
      return null;
    }

    console.log('✅ Mensaje enviado');
    return data;
  } catch (error) {
    console.error('❌ Error en sendMessage:', error);
    return null;
  }
};

// Marcar mensaje como leído
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

    return true;
  } catch (error) {
    console.error('❌ Error en markMessageAsRead:', error);
    return false;
  }
};

// Obtener conversaciones activas del usuario
export const getActiveConversations = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo conversaciones:', error);
      return [];
    }

    // Agrupar por conversación (remover duplicados)
    const conversations = new Map();
    data?.forEach((msg: any) => {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations.has(otherId)) {
        conversations.set(otherId, msg.created_at);
      }
    });

    return Array.from(conversations.entries()).map(([userId, lastMsg]) => ({
      user_id: userId,
      last_message_at: lastMsg,
    }));
  } catch (error) {
    console.error('❌ Error en getActiveConversations:', error);
    return [];
  }
};

// ============================================================================
// PROPOSALS
// ============================================================================

export interface Proposal {
  id: string;
  client_id: string;
  dj_id: string;
  monto: number;
  monto_contraoferta: number | null;
  horas_duracion: number;
  detalles: string | null;
  estado: string;
  estado_respuesta: string | null;
  fecha_evento: string | null;
  ubicacion_evento: string | null;
  generos_solicitados: string[] | null;
  ronda_contrapropuesta: number;
  created_at: string;
  updated_at: string;
  aceptada_at: string | null;
  completada_at: string | null;
}

// Crear propuesta
export const createProposal = async (
  clientId: string,
  djId: string,
  proposalData: Partial<Proposal>
): Promise<Proposal | null> => {
  try {
    // Only include columns that exist in the `proposals` table to avoid PGRST204
    const payload: any = {
      client_id: clientId,
      dj_id: djId,
      monto: proposalData.monto,
      horas_duracion: proposalData.horas_duracion,
      detalles: proposalData.detalles ?? null,
      fecha_evento: proposalData.fecha_evento ?? null,
      ubicacion_evento: proposalData.ubicacion_evento ?? null,
      generos_solicitados: proposalData.generos_solicitados ?? null,
    };

    const { data, error } = await supabase
      .from('proposals')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando propuesta:', error);
      return null;
    }

    console.log('✅ Propuesta creada');
    return data;
  } catch (error) {
    console.error('❌ Error en createProposal:', error);
    return null;
  }
};

// Obtener propuestas de un usuario (como cliente o DJ)
export const getUserProposals = async (userId: string): Promise<Proposal[]> => {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .or(`client_id.eq.${userId},dj_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo propuestas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getUserProposals:', error);
    return [];
  }
};

// Actualizar estado de propuesta
export const updateProposalStatus = async (
  proposalId: string,
  newStatus: string,
  updatedData: any = {}
): Promise<Proposal | null> => {
  try {
    const updatePayload: any = {
      estado: newStatus,
      ...updatedData,
    };

    if (newStatus === 'aceptada') {
      updatePayload.aceptada_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('proposals')
      .update(updatePayload)
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando propuesta:', error);
      return null;
    }

    console.log('✅ Propuesta actualizada');
    return data;
  } catch (error) {
    console.error('❌ Error en updateProposalStatus:', error);
    return null;
  }
};

// ============================================================================
// EVENTS
// ============================================================================

export interface EventType {
  id: string;
  proposal_id: string;
  client_id: string;
  dj_id: string;
  monto_final: number;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  ubicacion: string;
  generos_confirmados: string[] | null;
  descripcion: string | null;
  estado: string;
  calificacion_cliente: number | null;
  resena_cliente: string | null;
  calificacion_dj: number | null;
  resena_dj: string | null;
  comprobante_url: string | null;
  created_at: string;
  updated_at: string;
  cancelada_at: string | null;
}

// Crear evento desde propuesta aceptada
export const createEventFromProposal = async (
  proposalId: string,
  eventData: Partial<EventType>
): Promise<EventType | null> => {
  try {
    // Primero obtener la propuesta
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('❌ Error obteniendo propuesta:', proposalError);
      return null;
    }

    // Crear el evento
    const { data, error } = await supabase
      .from('events')
      .insert({
        proposal_id: proposalId,
        client_id: proposal.client_id,
        dj_id: proposal.dj_id,
        monto_final: proposal.monto_contraoferta || proposal.monto,
        ...eventData,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando evento:', error);
      return null;
    }

    console.log('✅ Evento creado desde propuesta');
    return data;
  } catch (error) {
    console.error('❌ Error en createEventFromProposal:', error);
    return null;
  }
};

// Obtener eventos de un usuario
export const getUserEvents = async (userId: string): Promise<EventType[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`client_id.eq.${userId},dj_id.eq.${userId}`)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo eventos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getUserEvents:', error);
    return [];
  }
};

// Agregar reseña a un evento
export const addReviewToEvent = async (
  eventId: string,
  reviewerId: string,
  revieweeId: string,
  calificacion: number,
  resena: string,
  aspectos: any = null
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('reviews')
      .insert({
        event_id: eventId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        calificacion,
        resena,
        aspectos,
      });

    if (error) {
      console.error('❌ Error creando reseña:', error);
      return false;
    }

    console.log('✅ Reseña creada');
    return true;
  } catch (error) {
    console.error('❌ Error en addReviewToEvent:', error);
    return false;
  }
};

// ============================================================================
// USER PROFILE UPDATES
// ============================================================================

// Actualizar perfil de usuario base
export const updateUserProfile = async (
  userId: string,
  profileData: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error actualizando user profile:', error);
      return false;
    }

    console.log('✅ User profile actualizado');
    return true;
  } catch (error) {
    console.error('❌ Error en updateUserProfile:', error);
    return false;
  }
};

// Marcar usuario como DJ
export const markUserAsDJ = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_dj: true })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error marcando usuario como DJ:', error);
      return false;
    }

    console.log('✅ Usuario marcado como DJ');
    return true;
  } catch (error) {
    console.error('❌ Error en markUserAsDJ:', error);
    return false;
  }
};

// Obtener DJ con nombre completo (para pantalla de perfil)
export const getDJWithDetails = async (userId: string): Promise<any> => {
  try {
    console.log('🔍 Buscando detalles del DJ para user_id:', userId);

    // Obtener ambos perfiles en paralelo
    const [userProfileResponse, djProfileResponse] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('dj_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const userProfile = userProfileResponse.data;
    const djProfile = djProfileResponse.data;

    if (userProfileResponse.error) {
      console.error('⚠️ Error obteniendo user profile:', userProfileResponse.error);
    }

    if (djProfileResponse.error) {
      console.error('⚠️ Error obteniendo DJ profile:', djProfileResponse.error);
    }

    // Si no existe ni user_profile ni dj_profile, retornar null
    if (!userProfile && !djProfile) {
      console.log('⚠️ No se encontró ni user_profile ni dj_profile para user_id:', userId);
      return null;
    }

    // Combinar datos: user_profile es prioritario para nombre y foto
    const combinedData = {
      user_id: userId,
      nombre: userProfile?.first_name || 'DJ',
      email: userProfile?.email || '',
      foto_perfil: userProfile?.foto_url || undefined, // La foto viene de user_profiles
      ...djProfile, // Datos del DJ (ubicación, tarifa, etc.)
    };

    console.log('✅ Datos del DJ combinados:', {
      nombre: combinedData.nombre,
      foto_perfil: combinedData.foto_perfil,
      ubicacion: combinedData.ubicacion
    });

    return combinedData;
  } catch (error) {
    console.error('❌ Error en getDJWithDetails:', error);
    return null;
  }
};

// ============================================================================
// WALLET & PAYMENTS
// ============================================================================

export interface Payment {
  id: string;
  token: string;
  monto: number;
  dj_id: string;
  client_id: string;
  event_id: string;
  proposal_id: string;
  estado: string;
  es_mock: boolean;
  created_at: string;
  events?: {
    fecha: string;
    ubicacion: string;
    descripcion: string;
  };
  client_profile?: {
    first_name: string;
    last_name: string;
  };
  dj_confirmation_status?: 'pending' | 'received' | 'reported';
  dj_confirmation_at?: string;
}

// Obtener pagos de un DJ
export const getPaymentsForDJ = async (djId: string): Promise<Payment[]> => {
  try {
    // 1. Fetch payments first
    const { data: payments, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('dj_id', djId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo pagos:', error);
      return [];
    }

    if (!payments || payments.length === 0) return [];

    // 2. Fetch client profiles manually
    const clientIds = [...new Set(payments.map(p => p.client_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', clientIds);

    // 3. Fetch events manually (Robust: check by ID and Proposal ID)
    const eventIds = [...new Set(payments.map(p => p.event_id).filter(Boolean))];
    const proposalIds = [...new Set(payments.map(p => p.proposal_id).filter(Boolean))];

    console.log('DEBUG: eventIds:', eventIds);
    console.log('DEBUG: proposalIds:', proposalIds);

    let events: any[] = [];

    if (eventIds.length > 0 || proposalIds.length > 0) {
      let query = supabase.from('events').select('id, proposal_id, fecha, ubicacion, descripcion');

      const conditions = [];
      if (eventIds.length > 0) conditions.push(`id.in.(${eventIds.join(',')})`);
      if (proposalIds.length > 0) conditions.push(`proposal_id.in.(${proposalIds.join(',')})`);

      console.log('DEBUG: conditions:', conditions);

      if (conditions.length > 0) {
        const { data, error } = await query.or(conditions.join(','));
        if (error) console.error('DEBUG: Error fetching events:', error);
        if (!error && data) {
          events = data;
          console.log('DEBUG: Fetched events:', events.length);
        }
      }
    }

    // 4. Merge everything
    const paymentsWithDetails = payments.map(payment => {
      const profile = profiles?.find(p => p.user_id === payment.client_id);

      // Try to find event by direct ID match first, then by proposal ID
      let event = events?.find(e => e.id === payment.event_id);
      if (!event && payment.proposal_id) {
        event = events?.find(e => e.proposal_id === payment.proposal_id);
      }

      return {
        ...payment,
        client_profile: profile ? {
          first_name: profile.first_name,
          last_name: profile.last_name
        } : undefined,
        events: event ? {
          fecha: event.fecha,
          ubicacion: event.ubicacion,
          descripcion: event.descripcion
        } : undefined
      };
    });

    return paymentsWithDetails;
  } catch (error) {
    console.error('❌ Error en getPaymentsForDJ:', error);
    return [];
  }
};

// Confirmar realización de evento (Liberar pago)
export const confirmPaymentEvent = async (paymentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pagos')
      .update({ estado: 'LIBERADO' })
      .eq('id', paymentId);

    if (error) {
      console.error('❌ Error confirmando evento:', error);
      return false;
    }

    console.log('✅ Pago liberado');
    return true;
  } catch (error) {
    console.error('❌ Error en confirmPaymentEvent:', error);
    return false;
  }
};

// Obtener propuestas aceptadas sin pago para un cliente
export const getUnpaidAcceptedProposals = async (clientId: string): Promise<Proposal[]> => {
  try {
    // 1. Obtener propuestas aceptadas
    const { data: proposals, error: proposalsError } = await supabase
      .from('proposals')
      .select('*')
      .eq('client_id', clientId)
      .eq('estado', 'aceptada');

    if (proposalsError) {
      console.error('❌ Error obteniendo propuestas aceptadas:', proposalsError);
      return [];
    }

    if (!proposals || proposals.length === 0) return [];

    // 2. Obtener pagos existentes para este cliente
    const { data: payments, error: paymentsError } = await supabase
      .from('pagos')
      .select('proposal_id')
      .eq('client_id', clientId);

    if (paymentsError) {
      console.error('❌ Error obteniendo pagos:', paymentsError);
      return []; // Fail safe
    }

    // 3. Filtrar propuestas que ya tienen pago
    const paidProposalIds = new Set(payments?.map(p => p.proposal_id));
    const unpaidProposals = proposals.filter(p => !paidProposalIds.has(p.id));

    return unpaidProposals;
  } catch (error) {
    console.error('❌ Error en getUnpaidAcceptedProposals:', error);
    return [];
  }
};

// Actualizar confirmación de recepción de pago por parte del DJ
export const updatePaymentConfirmation = async (
  paymentId: string,
  status: 'received' | 'reported'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pagos')
      .update({
        dj_confirmation_status: status,
        dj_confirmation_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (error) {
      console.error('❌ Error actualizando confirmación de pago:', error);
      return false;
    }

    console.log(`✅ Confirmación de pago actualizada a: ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Error en updatePaymentConfirmation:', error);
    return false;
  }
};
