import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as chatFunctions from './chat-functions';
import { getCurrentUser } from './supabase';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // 🔥 Usar un ref para evitar stale closures
  const unreadCountRef = useRef(0);

  // 🔥 Inicializar usuario actual y cargar conteo inicial
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          console.log('✅ NotificationContext inicializado para usuario:', user.id);
          setCurrentUserId(user.id);
          
          // Cargar conteo inicial
          const unreadMessages = await chatFunctions.getUnreadMessages(user.id);
          const count = unreadMessages ? unreadMessages.length : 0;
          unreadCountRef.current = count;
          setUnreadCount(count);
          console.log(`✅ Conteo inicial: ${count} mensajes no leídos`);
        }
      } catch (error) {
        console.error('❌ Error inicializando NotificationContext:', error);
      }
    };

    initializeUser();
  }, []);

  // 🔥 Función para obtener y actualizar el conteo de no leídas
  const refreshUnreadCount = useCallback(
    async (userId?: string) => {
      try {
        const userToUse = userId || currentUserId;
        if (!userToUse) {
          console.warn('⚠️ No hay userId disponible para refrescar conteo');
          return;
        }

        console.log('🔄 Refrescando conteo de no leídas...');
        const unreadMessages = await chatFunctions.getUnreadMessages(userToUse);
        const count = unreadMessages ? unreadMessages.length : 0;
        setUnreadCount(count);
        console.log(`✅ Conteo actualizado: ${count} mensajes no leídos`);
      } catch (error) {
        console.error('❌ Error refrescando unread count:', error);
      }
    },
    [currentUserId]
  );

  // 🔥 Suscribirse a nuevos mensajes en tiempo real + Polling periódico
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    // Suscripción en tiempo real
    const unsubscribe = chatFunctions.subscribeToAllMessages(currentUserId, (newMessage: any) => {
      // Si el mensaje es nuevo y no está leído, incrementar el contador
      if (!newMessage.is_read) {
        console.log('🔴 Incrementando contador (mensaje no leído)');
        unreadCountRef.current += 1;
        const newCount = unreadCountRef.current;
        console.log(`📊 Contador actualizado: ref=${newCount}`);
        setUnreadCount(newCount);
      }
    });

    // 🔥 Polling AGRESIVO: cada 5 segundos para detectar cambios rápidamente
    let pollCount = 0;
    const pollingInterval = setInterval(async () => {
      pollCount++;
      if (pollCount === 1) {
        console.log('🔄 Polling iniciado: cada 5 segundos');
      }
      
      try {
        const unreadMessages = await chatFunctions.getUnreadMessages(currentUserId);
        const count = unreadMessages ? unreadMessages.length : 0;
        
        if (unreadCountRef.current !== count) {
          console.log(`📊 POLLING DETECTÓ CAMBIO: ${unreadCountRef.current} → ${count} (Poll #${pollCount})`);
          unreadCountRef.current = count;
          setUnreadCount(count);
        } else if (pollCount <= 3) {
          // Loguear los primeros 3 polls para verificar que está funcionando
          console.log(`🔄 Poll #${pollCount}: sin cambios (count=${count})`);
        }
      } catch (error) {
        console.error('❌ Error en polling:', error);
      }
    }, 5000); // Cada 5 segundos

    return () => {
      if (unsubscribe) {
        console.log('🔕 Desuscribiendo de nuevos mensajes');
        unsubscribe();
      }
      clearInterval(pollingInterval);
    };
  }, [currentUserId]);

  const incrementUnreadCount = useCallback(() => {
    unreadCountRef.current += 1;
    const newCount = unreadCountRef.current;
    console.log(`➕ Incrementando: → ${newCount}`);
    setUnreadCount(newCount);
  }, []);

  const decrementUnreadCount = useCallback(() => {
    unreadCountRef.current = Math.max(0, unreadCountRef.current - 1);
    const newCount = unreadCountRef.current;
    console.log(`➖ Decrementando: → ${newCount}`);
    setUnreadCount(newCount);
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    setUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    refreshUnreadCount: () => {
      if (!currentUserId) {
        console.warn('⚠️ currentUserId no disponible');
        return Promise.resolve();
      }
      return refreshUnreadCount(currentUserId);
    },
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook para usar el contexto
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationProvider');
  }
  return context;
};
