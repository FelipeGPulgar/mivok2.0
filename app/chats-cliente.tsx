import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import * as notificationFunctions from '../lib/notification-functions';
import { getCurrentUser } from '../lib/supabase';

interface ChatItem {
  user_id: string;
  user_name?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function ChatsClienteScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  // Cargar chats activos
  const loadChats = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
      }

      setCurrentUser(user);
      console.log('📬 Cargando lista de chats Cliente...');

      const chatsList = await notificationFunctions.getActiveChatsList(user.id);
      console.log('📬 Chats cargados:', chatsList);
      setChats(chatsList as any[]);

      // Calcular total de no leídos
      const total = chatsList.reduce((sum, chat) => sum + chat.unread_count, 0);
      setTotalUnread(total);

      console.log(`✅ Se cargaron ${chatsList.length} chats`);
    } catch (error) {
      console.error('❌ Error cargando chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Suscribirse a actualizaciones de chats
  useFocusEffect(
    useCallback(() => {
      loadChats();

      // Suscribirse a nuevos mensajes en tiempo real
      if (currentUser) {
        const unsubscribe = notificationFunctions.subscribeToChatsUpdates(
          currentUser.id,
          () => {
            console.log('🔄 Recargando chats...');
            loadChats();
          }
        );

        return unsubscribe;
      }
    }, [currentUser, loadChats])
  );

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleChatPress = async (userId: string, userName?: string) => {
    console.log('🔗 Abriendo chat con:', userId, userName);
    // Ir a la pantalla de chat
    router.push({
      pathname: '/chat',
      params: { userId, userName },
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item.user_id, item.user_name)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.user_name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>{item.user_name || 'Usuario'}</Text>
          <Text style={styles.chatTime}>{formatTime(item.last_message_time)}</Text>
        </View>
        <Text
          style={[
            styles.chatMessage,
            item.unread_count > 0 && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {item.last_message}
        </Text>
      </View>

      {item.unread_count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>💬 Mensajes</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>

        {/* Lista de chats */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando chats...</Text>
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📭 Sin mensajes aún</Text>
            <Text style={styles.emptySubtext}>
              Cuando recibas mensajes, aparecerán aquí
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.user_id}
            scrollEnabled={true}
          />
        )}
      </SafeAreaView>

      {/* Bottom Navigation */}
      <BottomNavBar 
        activeTab="mensajes"
        unreadCount={totalUnread}
        onHomePress={() => router.push('/home-cliente')}
        onEventosPress={() => router.push('/eventos-cliente')}
        onSearchPress={() => router.push('/chats-cliente')}
        onAlertasPress={() => router.push('/alertas-cliente')}
        onMasPress={() => router.push('/apartadomascliente')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    paddingRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginLeft: 8,
  },
  headerBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  chatMessage: {
    fontSize: 14,
    color: '#ccc',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 24,
    marginBottom: 8,
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
