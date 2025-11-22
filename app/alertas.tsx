import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import { useNotifications } from '../lib/NotificationContext';
import * as chatFunctions from '../lib/chat-functions';
import { getCurrentUser } from '../lib/supabase';
import * as supabaseFunctions from '../lib/supabase-functions';

interface Alert {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'message' | 'proposal' | 'proposal_response';
  originalMessageId: string;
}

export default function AlertasScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // 🔥 Usar el contexto global de notificaciones
  const { unreadCount, setUnreadCount, incrementUnreadCount, decrementUnreadCount } = useNotifications();

  // Cargar alertas al montar
  useEffect(() => {
    let unsubscribeMessages: any = null;

    const loadAlerts = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        console.log('📢 Cargando alertas para usuario:', user.id);

        // Obtener todos los mensajes no leídos del usuario
        const unreadMessages = await chatFunctions.getUnreadMessages(user.id);
        
        if (unreadMessages && unreadMessages.length > 0) {
          console.log(`✅ Se encontraron ${unreadMessages.length} mensajes no leídos`);

          // Procesar los mensajes y convertirlos en alertas
          const processedAlerts: Alert[] = [];

          for (const msg of unreadMessages) {
            try {
              // Obtener info del remitente
              const senderProfile = await supabaseFunctions.getDJWithDetails(msg.sender_id);
              
              const alert: Alert = {
                id: msg.id,
                sender_id: msg.sender_id,
                sender_name: senderProfile?.nombre || senderProfile?.first_name || 'Usuario',
                sender_avatar: senderProfile?.imagen_url || senderProfile?.foto_perfil || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
                message: msg.content_type === 'text' 
                  ? msg.content 
                  : msg.metadata?.isProposal 
                    ? `💰 Propuesta: ${msg.metadata?.proposal?.monto} CLP`
                    : msg.metadata?.isProposalResponse
                      ? `🔄 Respuesta a propuesta: ${msg.metadata?.proposal?.estado}`
                      : 'Mensaje',
                timestamp: new Date(msg.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }),
                isRead: msg.is_read || false,
                type: msg.metadata?.isProposal 
                  ? 'proposal' 
                  : msg.metadata?.isProposalResponse 
                    ? 'proposal_response' 
                    : 'message',
                originalMessageId: msg.id,
              };

              processedAlerts.push(alert);
            } catch (error) {
              console.error('❌ Error procesando alerta:', error);
            }
          }

          setAlerts(processedAlerts);
          // 🔥 Actualizar el contador en el contexto global
          setUnreadCount(processedAlerts.filter(a => !a.isRead).length);
        } else {
          console.log('ℹ️ No hay alertas');
          setAlerts([]);
          setUnreadCount(0);
        }

        // 🔔 SUSCRIBIRSE A NUEVOS MENSAJES EN TIEMPO REAL
        unsubscribeMessages = chatFunctions.subscribeToAllMessages(user.id, async (newMessage: any) => {
          console.log('📢 Nuevo mensaje recibido en pantalla de alertas:', newMessage.id);

          // Obtener info del remitente
          try {
            const senderProfile = await supabaseFunctions.getDJWithDetails(newMessage.sender_id);
            
            const newAlert: Alert = {
              id: newMessage.id,
              sender_id: newMessage.sender_id,
              sender_name: senderProfile?.nombre || senderProfile?.first_name || 'Usuario',
              sender_avatar: senderProfile?.imagen_url || senderProfile?.foto_perfil || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
              message: newMessage.content_type === 'text'
                ? newMessage.content
                : newMessage.metadata?.isProposal
                  ? `💰 Propuesta: ${newMessage.metadata?.proposal?.monto} CLP`
                  : newMessage.metadata?.isProposalResponse
                    ? `🔄 Respuesta a propuesta: ${newMessage.metadata?.proposal?.estado}`
                    : 'Mensaje',
              timestamp: new Date(newMessage.created_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
              isRead: newMessage.is_read || false,
              type: newMessage.metadata?.isProposal
                ? 'proposal'
                : newMessage.metadata?.isProposalResponse
                  ? 'proposal_response'
                  : 'message',
              originalMessageId: newMessage.id,
            };

            // Agregar nueva alerta al inicio de la lista
            setAlerts(prev => [newAlert, ...prev]);
            // 🔥 Usar el método del contexto para incrementar
            if (!newMessage.is_read) {
              incrementUnreadCount();
            }
          } catch (error) {
            console.error('❌ Error procesando nueva alerta:', error);
          }
        });
      } catch (error) {
        console.error('❌ Error cargando alertas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    // Limpiar suscripción al desmontar
    return () => {
      if (unsubscribeMessages) {
        console.log('🔌 Desuscribiendo de nuevos mensajes');
        unsubscribeMessages();
      }
    };
  }, []);

  // Navegar al chat cuando se toca una alerta
  const handleAlertPress = useCallback(async (alert: Alert) => {
    try {
      console.log('👆 Alerta tocada:', alert.id);
      
      // Marcar como leída
      if (!alert.isRead) {
        await chatFunctions.markMessageAsRead(alert.originalMessageId);
        
        // Actualizar en la lista
        setAlerts(prev =>
          prev.map(a =>
            a.id === alert.id ? { ...a, isRead: true } : a
          )
        );
        
        // 🔥 Usar el método del contexto para decrementar
        decrementUnreadCount();
      }

      // Navegar al chat
      router.push({
        pathname: '/chat',
        params: {
          userId: alert.sender_id,
          userName: alert.sender_name,
        },
      });
    } catch (error) {
      console.error('❌ Error al navegar al chat:', error);
    }
  }, [router]);

  // Renderizar una alerta
  const renderAlert = ({ item }: { item: Alert }) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'proposal':
          return '💰';
        case 'proposal_response':
          return '🔄';
        default:
          return '💬';
      }
    };

    return (
      <TouchableOpacity
        style={[styles.alertItem, !item.isRead && styles.alertItemUnread]}
        onPress={() => handleAlertPress(item)}
      >
        <Image
          source={{ uri: item.sender_avatar }}
          style={styles.avatar}
        />

        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.senderName}>{item.sender_name}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {getTypeIcon(item.type)} {item.message}
          </Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  // Pantalla vacía
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Sin alertas</Text>
      <Text style={styles.emptySubtitle}>
        Aquí verás los mensajes y propuestas que recibas
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5B7EFF" strokeWidth={2}>
            <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <Path d="M15 6l-6 6l6 6" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.title}>Alertas</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Alertas List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando alertas...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={alerts.length === 0 ? styles.listEmpty : { paddingTop: 8 }}
          scrollIndicatorInsets={{ right: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Nav */}
      <BottomNavBar
        activeTab="alertas"
        unreadCount={unreadCount}
        onHomePress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj' 
            ? '/home-dj' 
            : '/home-cliente';
          router.push(route);
        }}
        onEventosPress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj'
            ? '/eventos-dj'
            : '/eventos-cliente';
          router.push(route as any);
        }}
        onSearchPress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj'
            ? '/chats-dj'
            : '/chats-cliente';
          router.push(route as any);
        }}
        onAlertasPress={() => {}}
        onMasPress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj'
            ? '/apartadodj'
            : '/apartadomascliente';
          router.push(route as any);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#111',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#111',
  },
  alertItemUnread: {
    backgroundColor: '#1a1a1a',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  message: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B7EFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  listEmpty: {
    flexGrow: 1,
  },
});
