// lib/notification-functions.ts
// Funciones para manejar notificaciones de mensajes en Supabase

import { getCurrentUser, supabase } from './supabase';

// ============================================================================
// INTERFACES
// ============================================================================

export interface MessageNotification {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  sender_avatar?: string;
  message_preview: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  message_id: string;
}

export interface ChatListItem {
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_dj?: boolean;
}

// ============================================================================
// CREAR NOTIFICACIÓN AL ENVIAR MENSAJE
// ============================================================================

/**
 * Crear una notificación cuando se envía un mensaje
 * Se debe llamar después de sendMessage()
 */
export const createMessageNotification = async (
  senderId: string,
  receiverId: string,
  messagePreview: string,
  messageId: string
): Promise<MessageNotification | null> => {
  try {
    // Asegurar que usamos el UID de la sesión actual para evitar fallos RLS
    const current = await getCurrentUser();
    const currentUid = current?.id || null;

    if (!currentUid) {
      console.warn('⚠️ createMessageNotification: no hay usuario autenticado. Se omite la creación de notificación para evitar RLS.');
      return null;
    }

    if (currentUid !== senderId) {
      console.log('🔐 createMessageNotification: senderId proporcionado no coincide con auth.uid(), usando auth.uid() en su lugar', { provided: senderId, authUid: currentUid });
    }

    const senderIdResolved = currentUid;

    // Obtener info del sender para guardar nombre y avatar
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', senderIdResolved)
      .single();

    // Verificar que la sesión activa coincide con el senderIdResolved
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id || null;
      if (!sessionUserId) {
        console.warn('⚠️ createMessageNotification: no hay sesión activa en supabase.auth; se omite la inserción para evitar RLS');
        return null;
      }

      if (sessionUserId !== senderIdResolved) {
        console.warn('⚠️ createMessageNotification: la sesión activa no coincide con el sender; se omite la inserción para evitar RLS', { sessionUserId, senderIdResolved });
        return null;
      }
    } catch (sessErr) {
      console.warn('⚠️ createMessageNotification: no se pudo verificar la sesión, omitiendo inserción para evitar RLS', sessErr);
      return null;
    }

    const { data, error } = await supabase
      .from('message_notifications')
      .insert({
        sender_id: senderIdResolved,
        receiver_id: receiverId,
        sender_name: senderProfile?.first_name || 'Usuario',
        message_preview: messagePreview.substring(0, 100),
        message_id: messageId,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      // Log completo para debugging (RLS puede bloquear inserts)
      try {
        console.error('❌ Error creando notificación:', JSON.stringify(error));
      } catch (e) {
        console.error('❌ Error creando notificación (no se pudo stringify):', error);
      }

      if ((error as any)?.code === '42501') {
        console.error('🔒 Error RLS detectado al insertar en `message_notifications`. Las RLS policies están bloqueando la inserción.');
        console.error('🔎 Payload intentado:', {
          sender_id: senderId,
          receiver_id: receiverId,
          sender_name: senderProfile?.first_name || 'Usuario',
          message_preview: messagePreview?.substring(0, 100),
          message_id: messageId,
        });
        console.error('➡️ SQL ejemplo para permitir inserts (pega en Supabase SQL Editor):\n');
        console.error('DROP POLICY IF EXISTS "Users can insert message_notifications" ON public.message_notifications;\nCREATE POLICY "Users can insert message_notifications" ON public.message_notifications FOR INSERT WITH CHECK (sender_id = auth.uid());');
      }

      return null;
    }

    console.log('✅ Notificación creada:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error en createMessageNotification:', error);
    return null;
  }
};

// ============================================================================
// MENSAJES DEL SISTEMA (Alertas sobre eventos)
// ============================================================================

/**
 * Crear un mensaje de sistema entre dos usuarios (ej: "DJ X canceló el evento...")
 * Este helper intenta verificar que la sesión coincide con el `senderId` para
 * evitar fallos por RLS cuando se inserta desde el cliente.
 */
export const createSystemMessage = async (
  senderId: string,
  receiverId: string,
  content: string
): Promise<any | null> => {
  try {
    const current = await getCurrentUser();
    const currentUid = current?.id || null;

    if (!currentUid) {
      console.warn('⚠️ createSystemMessage: no hay usuario autenticado. Se omite para evitar RLS.');
      return null;
    }

    const SYSTEM_ID = '00000000-0000-0000-0000-000000000000';
    let senderIdResolved = currentUid;

    // Permitir usar SYSTEM_ID si se proporciona explícitamente
    if (senderId === SYSTEM_ID) {
      console.log('🤖 createSystemMessage: Usando SYSTEM_ID explícito');
      senderIdResolved = SYSTEM_ID;

      // Intentar usar RPC para evitar RLS si existe la función
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('send_system_message', {
          p_receiver_id: receiverId,
          p_content: content
        });

        if (!rpcError) {
          console.log('✅ Mensaje de sistema enviado vía RPC');
          return rpcData;
        } else {
          console.warn('⚠️ Falló RPC send_system_message, intentando insert normal:', rpcError.message);
        }
      } catch (e) {
        console.warn('⚠️ Error llamando RPC:', e);
      }
    } else if (currentUid !== senderId) {
      console.log('🔐 createSystemMessage: senderId proporcionado no coincide con auth.uid(), usando auth.uid() en su lugar', { provided: senderId, authUid: currentUid });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderIdResolved,
        receiver_id: receiverId,
        content,
        content_type: 'text',
        metadata: { system: true },
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando mensaje de sistema:', error);
      return null;
    }

    console.log('✅ Mensaje de sistema creado:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Error en createSystemMessage:', error);
    return null;
  }
};

// ============================================================================
// OBTENER NOTIFICACIONES NO LEÍDAS
// ============================================================================

/**
 * Obtener todas las notificaciones no leídas de un usuario
 */
export const getUnreadNotifications = async (
  userId: string
): Promise<MessageNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('message_notifications')
      .select('*')
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getUnreadNotifications:', error);
    return [];
  }
};

/**
 * Contar notificaciones no leídas
 */
export const getUnreadNotificationsCount = async (
  userId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('message_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Error contando notificaciones:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error en getUnreadNotificationsCount:', error);
    return 0;
  }
};

// ============================================================================
// MARCAR COMO LEÍDO
// ============================================================================

/**
 * Marcar una notificación como leída
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('message_notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Error marcando notificación como leída:', error);
      return false;
    }

    console.log('✅ Notificación marcada como leída');
    return true;
  } catch (error) {
    console.error('❌ Error en markNotificationAsRead:', error);
    return false;
  }
};

/**
 * Marcar todas las notificaciones de un usuario como leídas
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('message_notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Error marcando todas las notificaciones como leídas:', error);
      return false;
    }

    console.log('✅ Todas las notificaciones marcadas como leídas');
    return true;
  } catch (error) {
    console.error('❌ Error en markAllNotificationsAsRead:', error);
    return false;
  }
};

// ============================================================================
// OBTENER LISTA DE CHATS ACTIVOS (CON ÚLTIMO MENSAJE)
// ============================================================================

/**
 * Obtener lista de conversaciones activas con última información
 */
export const getActiveChatsList = async (
  userId: string
): Promise<ChatListItem[]> => {
  try {
    // Obtener últimos mensajes recibidos y enviados
    const { data: messages, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at, is_read')
      .or(
        `receiver_id.eq.${userId},sender_id.eq.${userId}`
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      return [];
    }

    if (!messages || messages.length === 0) {
      console.log('ℹ️ Sin mensajes');
      return [];
    }

    // Agrupar por usuario conversación
    const chatMap = new Map<string, ChatListItem>();

    for (const msg of messages) {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

      if (!chatMap.has(otherUserId)) {
        // Obtener info del otro usuario de user_profiles primero
        let userName = 'Usuario';

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, foto_url')
          .eq('user_id', otherUserId)
          .single();

        if (profile?.first_name) {
          userName = profile.first_name;
        }

        // Contar no leídos
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', otherUserId)
          .eq('receiver_id', userId)
          .eq('is_read', false);

        chatMap.set(otherUserId, {
          user_id: otherUserId,
          user_name: userName,
          last_message: msg.content.substring(0, 50),
          last_message_time: msg.created_at,
          unread_count: unreadCount || 0,
        });
      }
    }

    const result = Array.from(chatMap.values())
      .sort((a, b) =>
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

    console.log('✅ Chats cargados:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getActiveChatsList:', error);
    return [];
  }
};

// ============================================================================
// SUSCRIBIRSE A NOTIFICACIONES EN TIEMPO REAL
// ============================================================================

/**
 * Suscribirse a nuevas notificaciones en tiempo real
 */
export const subscribeToNotifications = (
  userId: string,
  onNewNotification: (notification: MessageNotification) => void
): (() => void) => {
  const channel = supabase
    .channel(`notifications_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_notifications',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log('📬 Nueva notificación:', payload.new);
        onNewNotification(payload.new as MessageNotification);
      }
    )
    .subscribe((status) => {
      console.log(`🔔 Estado suscripción notificaciones: ${status}`);
    });

  return () => {
    console.log('🔌 Desuscribiendo de notificaciones...');
    supabase.removeChannel(channel);
  };
};

/**
 * Suscribirse a cambios en la lista de chats (nuevos mensajes)
 */
export const subscribeToChatsUpdates = (
  userId: string,
  onUpdate: (message: any) => void
): (() => void) => {
  const channel = supabase
    .channel(`chats_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(receiver_id=eq.${userId},sender_id=eq.${userId})`,
      },
      (payload: any) => {
        console.log('💬 Nuevo mensaje en chats:', payload.new);
        onUpdate(payload.new);
      }
    )
    .subscribe((status) => {
      console.log(`💬 Estado suscripción chats: ${status}`);
    });

  return () => {
    console.log('🔌 Desuscribiendo de chats...');
    supabase.removeChannel(channel);
  };
};
