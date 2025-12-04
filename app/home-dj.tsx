import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import { useNotifications } from '../lib/NotificationContext';
import * as notificationManager from '../lib/notifications';
import * as profileFunctions from '../lib/profile-functions';
import { getCurrentUser } from '../lib/supabase';

export default function HomeDJScreen() {
  const router = useRouter();
  const [apodoDJ, setApodoDJ] = useState('DJ');
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // 🔔 Usar el contexto de notificaciones
  const { unreadCount } = useNotifications();

  // Función para cargar el perfil completo
  const cargarPerfil = useCallback(async () => {
    try {
      // 🔔 Registrarse para push notifications
      notificationManager.setupNotificationHandler();
      const pushToken = await notificationManager.registerForPushNotificationsAsync();
      if (pushToken) {
        console.log('✅ Push notifications registradas en home-dj');
      }

      // Cargar usuario actual
      const user = await getCurrentUser();
      if (user) {
        // Primero intentar cargar el nombre del perfil DJ desde Supabase
        try {
          const djProfile = await profileFunctions.getCurrentProfile();
          if (djProfile?.first_name) {
            setApodoDJ(djProfile.first_name.split(' ')[0]);
            console.log('✅ Nombre del DJ cargado desde Supabase:', djProfile.first_name);
          } else {
            // Fallback a user_metadata
            const userName = user.user_metadata?.full_name?.split(' ')[0] || 'DJ';
            setApodoDJ(userName);
          }
        } catch (error) {
          // Si hay error cargando desde Supabase, usar user_metadata
          const userName = user.user_metadata?.full_name?.split(' ')[0] || 'DJ';
          setApodoDJ(userName);
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo perfil DJ:', error);
      setApodoDJ('DJ');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar imagen de perfil cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      const cargarImagenPerfil = async () => {
        try {
          // 🔥 Cargar foto_url desde Supabase (foto_url)
          const profileData = await profileFunctions.getCurrentProfile();
          console.log('📸 Imagen de perfil cargada:', profileData?.foto_url ? 'Sí' : 'No');
          if (profileData?.foto_url) {
            setProfileImage(profileData.foto_url);
          } else {
            setProfileImage(null);
          }
        } catch (error) {
          console.error('Error cargando imagen de perfil:', error);
        }
      };

      // Cargar perfil e imagen cuando la pantalla recibe foco
      // Pequeño delay para asegurar que la query a Supabase esté completa
      setTimeout(() => {
        cargarPerfil();
        cargarImagenPerfil();
      }, 300);
    }, [cargarPerfil])
  );

  useEffect(() => {
    // Initial load
    cargarPerfil();
  }, [cargarPerfil]);

  // 🔔 Logging del contexto de notificaciones en home-dj
  useEffect(() => {
    console.log(`🏠 Home DJ: unreadCount del contexto = ${unreadCount}`);
  }, [unreadCount]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hola}>Hola, {loading ? 'DJ' : apodoDJ}</Text>
            <Text style={styles.wave}>👋</Text>
          </View>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => router.push('/apartadodj')}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="#fff">
                  <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <Path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
                  <Path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                </Svg>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* DJ Content */}
        {/* Ganancias / Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/billetera')}
          >
            <Text style={styles.statLabel}>Ganancias</Text>
            <Text style={styles.statValue}>$0.00</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Trabajos</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>

        {/* Tu Portafolio */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Tu Portafolio <Text style={{ fontSize: 28 }}>🎵</Text></Text>
          <Text style={styles.cardDesc}>
            Muestra tu experiencia y atrae más clientes. Agrega eventos donde has trabajado.
          </Text>
          <TouchableOpacity
            style={styles.goBtn}
            onPress={() => router.push('/apartado-dj-portafolio')}
          >
            <Text style={styles.goBtnText}>Gestionar Portafolio</Text>
          </TouchableOpacity>
        </View>

        {/* Próximos Eventos */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Próximos Eventos <Text style={{ fontSize: 28 }}>🎉</Text></Text>
          <Text style={styles.cardDesc}>
            Visualiza tus próximas presentaciones y prepárate para dar lo mejor.
          </Text>
        </View>

        {/* Métodos de Pago */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Métodos de Pago <Text style={{ fontSize: 28 }}>💰</Text></Text>
          <Text style={styles.cardDesc}>
            Configura y gestiona tus métodos de pago para recibir tus ganancias.
          </Text>
          <TouchableOpacity style={styles.goBtn}>
            <Text style={styles.goBtnText}>Gestionar Métodos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation - part of natural layout flow */}
      <BottomNavBar
        activeTab="inicio"
        onHomePress={() => { }}
        onEventosPress={() => router.push('/eventos-dj' as any)}
        onSearchPress={() => router.push('/chats-dj')}
        onAlertasPress={() => router.push('/alertas-dj')}
        onMasPress={() => router.push('/apartadodj')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    flexDirection: 'column',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  hola: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wave: {
    fontSize: 36,
    marginTop: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    backgroundColor: '#222',
    borderRadius: 36,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarIcon: {
    width: 40,
    height: 40,
    tintColor: '#fff',
  },
  // DJ Stats Container
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#191919',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    color: '#5B7EFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardBox: {
    backgroundColor: '#191919',
    borderRadius: 28,
    padding: 28,
    marginBottom: 32,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 34,
  },
  cardDesc: {
    color: '#bbb',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 24,
  },
  goBtn: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  goBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
