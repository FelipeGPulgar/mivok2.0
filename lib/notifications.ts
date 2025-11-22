import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

// NOTE: expo-notifications was removed from Expo Go (SDK 53+). Import it
// dynamically at runtime and provide no-op fallbacks when it's unavailable
// (for example when running inside plain Expo Go). This prevents bundling
// errors like "expo-notifications functionality provided by expo-notifications
// was removed from Expo Go" and allows the app to run without a dev build.

let Notifications: any = null;
const ensureNotifications = async () => {
  if (Notifications) return Notifications;
  try {
    // dynamic import so bundler doesn't eagerly require native module
    Notifications = await import('expo-notifications');
    return Notifications;
  } catch (e: any) {
    console.warn('⚠️ expo-notifications not available in this environment:', e?.message || e);
    Notifications = null;
    return null;
  }
};

const UNREAD_COUNT_KEY = '@mivok/unread_notifications_count';

// ============================================================================
// PUSH NOTIFICATION SETUP - Configurar Expo Push Notifications
// ============================================================================

/**
 * Registrar el dispositivo para recibir push notifications
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('⚠️ Debe usar un dispositivo físico para recibir push notifications');
    return null;
  }

  try {
    const ntf = await ensureNotifications();
    if (!ntf) {
      console.log('⚠️ expo-notifications no disponible en este entorno — omitiendo registro de push');
      return null;
    }

    const { status: existingStatus } = await ntf.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await ntf.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permisos de notificación denegados');
      return null;
    }

    // Obtener el token de push
    const token = (await ntf.getExpoPushTokenAsync()).data;
    console.log('✅ Expo Push Token:', token);
    
    // Guardar el token localmente
    await AsyncStorage.setItem('@mivok/expo_push_token', token);
    
    return token;
  } catch (error) {
    console.error('❌ Error registrando push notifications:', error);
    return null;
  }
}

/**
 * Obtener el token de push guardado
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('@mivok/expo_push_token');
    return token;
  } catch (error) {
    console.error('❌ Error obteniendo push token:', error);
    return null;
  }
}

// ============================================================================
// NOTIFICACIÓN HANDLER - Configurar cómo se muestran las notificaciones
// ============================================================================

/**
 * Configurar el handler de notificaciones
 * Esto define qué hacer cuando llega una notificación
 */
export function setupNotificationHandler() {
  // Configure handler only if notifications module is available
  ensureNotifications().then((ntf) => {
    if (!ntf) {
      console.log('⚠️ setupNotificationHandler: expo-notifications no disponible, omitiendo handler');
      return;
    }

    ntf.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }).catch((e) => console.warn('setupNotificationHandler error:', e));
}

/**
 * Enviar notificación local cuando llega un mensaje
 */
export async function sendMessageNotification(
  senderName: string,
  messagePreview: string,
  messageId: string
): Promise<void> {
  try {
    console.log('🔔 Enviando notificación local para:', senderName);

    const ntf = await ensureNotifications();
    if (!ntf) {
      console.log('⚠️ sendMessageNotification: expo-notifications no disponible, omitiendo notificación');
      return;
    }

    await ntf.scheduleNotificationAsync({
      content: {
        title: `Nuevo mensaje de ${senderName}`,
        body: messagePreview.substring(0, 100),
        data: {
          messageId,
          senderName,
        },
        badge: 1,
        sound: 'default',
      },
      trigger: null, // Mostrar inmediatamente
    });

    console.log('✅ Notificación enviada correctamente');
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
  }
}

/**
 * Enviar notificación para propuesta recibida
 */
export async function sendProposalNotification(
  senderName: string,
  amount: number,
  hours: number,
  messageId: string
): Promise<void> {
  try {
    console.log('💰 Enviando notificación de propuesta de:', senderName);

    const ntf = await ensureNotifications();
    if (!ntf) {
      console.log('⚠️ sendProposalNotification: expo-notifications no disponible, omitiendo notificación');
      return;
    }

    await ntf.scheduleNotificationAsync({
      content: {
        title: `Propuesta de ${senderName}`,
        body: `${amount} CLP por ${hours} horas`,
        data: {
          messageId,
          senderName,
          type: 'proposal',
        },
        badge: 1,
        sound: 'default',
      },
      trigger: null, // Mostrar inmediatamente
    });

    console.log('✅ Notificación de propuesta enviada');
  } catch (error) {
    console.error('❌ Error enviando notificación de propuesta:', error);
  }
}

/**
 * Enviar notificación para respuesta de propuesta
 */
export async function sendProposalResponseNotification(
  senderName: string,
  status: 'aceptada' | 'rechazada' | 'contraoferta',
  messageId: string
): Promise<void> {
  try {
    const statusText = 
      status === 'aceptada' ? '✅ Aceptada' :
      status === 'rechazada' ? '❌ Rechazada' :
      '🔄 Contraoferta';

    console.log('🔄 Enviando notificación de respuesta:', statusText);

    const ntf = await ensureNotifications();
    if (!ntf) {
      console.log('⚠️ sendProposalResponseNotification: expo-notifications no disponible, omitiendo notificación');
      return;
    }

    await ntf.scheduleNotificationAsync({
      content: {
        title: `Respuesta a tu propuesta`,
        body: `${senderName}: ${statusText}`,
        data: {
          messageId,
          senderName,
          type: 'proposal_response',
          status,
        },
        badge: 1,
        sound: 'default',
      },
      trigger: null, // Mostrar inmediatamente
    });

    console.log('✅ Notificación de respuesta enviada');
  } catch (error) {
    console.error('❌ Error enviando notificación de respuesta:', error);
  }
}

// ============================================================================
// UNREAD NOTIFICATIONS COUNT
// ============================================================================

export async function getUnreadCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(UNREAD_COUNT_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

export async function setUnreadCount(count: number): Promise<void> {
  try {
    const safe = Math.max(0, Math.floor(count));
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, String(safe));
  } catch {
    // noop
  }
}

export async function incrementUnread(by: number = 1): Promise<void> {
  const current = await getUnreadCount();
  await setUnreadCount(current + by);
}

export async function markAllRead(): Promise<void> {
  await setUnreadCount(0);
}
