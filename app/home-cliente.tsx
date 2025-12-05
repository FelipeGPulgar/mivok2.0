import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import { useNotifications } from '../lib/NotificationContext';
import * as notificationManager from '../lib/notifications';
import * as profileFunctions from '../lib/profile-functions';

export default function HomeClienteScreen() {
  const router = useRouter();
  const [apodoCliente, setApodoCliente] = useState('Cliente');
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
        console.log('✅ Push notifications registradas en home-cliente');
      }
      
      // Cargar datos del usuario con fallbacks
      const userData = await profileFunctions.loadUserDataWithFallbacks();
      console.log('✅ Datos del cliente cargados:', userData);
      setApodoCliente(userData.name);
      
      // 🔥 TAMBIÉN SETEAR LA IMAGEN DESDE LOS MISMOS DATOS
      if (userData.profileImage) {
        console.log('✅ Imagen de perfil seteada desde userData');
        setProfileImage(userData.profileImage);
      } else {
        console.log('ℹ️ Sin imagen en userData, usando default');
        setProfileImage('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop');
      }
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      setApodoCliente('Usuario');
      setProfileImage('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar perfil cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      // Cargar perfil y imagen cuando la pantalla recibe foco
      setTimeout(() => {
        cargarPerfil(); // Ya incluye la imagen de perfil
      }, 300);
    }, [cargarPerfil])
  );

  useEffect(() => {
    // Initial load
    cargarPerfil();
  }, [cargarPerfil]);

  // 🔔 Logging del contexto de notificaciones en home-cliente
  useEffect(() => {
    console.log(`🏠 Home Cliente: unreadCount del contexto = ${unreadCount}`);
  }, [unreadCount]);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hola}>Hola, {loading ? 'Usuario' : apodoCliente}</Text>
            <Text style={styles.wave}>👋</Text>
          </View>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={styles.avatarCircle}
              onPress={() => router.push('/apartadomascliente')}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="#fff">
                  <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <Path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
                  <Path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                </Svg>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Cliente Content */}
        {/* Busca DJs */}
        <View style={styles.eventBox}>
          <Text style={styles.eventText}>Busca el DJ perfecto <Text style={{fontSize:24}}>🎧</Text></Text>
        </View>

        {/* Explorar DJs */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Explora DJs disponibles <Text style={{fontSize:28}}>⭐</Text></Text>
          <Text style={styles.cardDesc}>
            Encuentra los mejores DJs en tu área. Compara perfiles, revisa portafolios y reserva con confianza.
          </Text>
          <TouchableOpacity 
            style={styles.goBtn}
            onPress={() => router.push('/buscar-djs')}
          >
            <Text style={styles.goBtnText}>Explorar</Text>
          </TouchableOpacity>
        </View>

        {/* Mis Eventos */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Mis Eventos <Text style={{fontSize:28}}>🎉</Text></Text>
          <Text style={styles.cardDesc}>
            Gestiona tus eventos y contrataciones. Aquí verás todos tus eventos programados.
          </Text>
        </View>
      </View>
      {/* Bottom Navigation - part of natural layout flow */}
      <BottomNavBar 
        activeTab="inicio"
        onHomePress={() => {}}
        onEventosPress={() => router.push('/eventos-cliente' as any)}
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
    backgroundColor: '#111',
    flexDirection: 'column',
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    justifyContent: 'flex-start',
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
  eventBox: {
    backgroundColor: '#191919',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
  },
  eventText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
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
