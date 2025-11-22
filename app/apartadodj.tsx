import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import { getUnreadCount, markAllRead } from '../lib/notifications';
import * as profileFunctions from '../lib/profile-functions';
import { getCurrentUser } from '../lib/supabase';

function HomeIcon() {
  return (
    <Ionicons name="home-outline" size={24} color="#666" />
  );
}

function BellIcon() {
  return (
    <Ionicons name="notifications-outline" size={24} color="#666" />
  );
}

function HelpIcon() {
  return (
    <Ionicons name="help-circle-outline" size={24} color="#666" />
  );
}

function BriefcaseIcon() {
  return (
    <Ionicons name="briefcase-outline" size={24} color="#666" />
  );
}

function MailIcon() {
  return (
    <Ionicons name="mail-outline" size={24} color="#666" />
  );
}

export default function ApartadoDJScreen() {
  const router = useRouter();
  const DJ_FLAG_KEY = '@mivok/is_dj_registered';
  const [unread, setUnread] = useState<number>(0);

  // Initial load
  useEffect(() => {
    // Cargar conteo de no leídas
    getUnreadCount().then(setUnread).catch(() => setUnread(0));
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      '¿Estás seguro?',
      'Esta acción no se puede deshacer. Tu cuenta será suspendida por 24 horas y luego eliminada permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: confirmDeleteAccount
        }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Última confirmación',
      '¿Realmente quieres eliminar tu cuenta? Perderás todos tus datos, reseñas y conexiones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: () => router.push('/cuenta-eliminada' as any)
        }
      ]
    );
  };

  const openNotifications = async () => {
    // Aquí podrías navegar a una pantalla de notificaciones cuando exista
    // Por ahora, marcamos como leídas y actualizamos el badge
    await markAllRead();
    setUnread(0);
    Alert.alert('Notificaciones', 'No tienes notificaciones nuevas');
  };

  // 🔒 Photo change functionality moved to Editar Perfil screen only

  const menuItems = [
    {
      icon: <HomeIcon />,
      text: 'Inicio',
      onPress: () => router.back(),
    },
    {
      icon: <BellIcon />,
      text: 'Notificaciones',
      onPress: openNotifications,
    },
    {
      icon: <HelpIcon />,
      text: 'Ayuda',
      onPress: () => router.push('/ayuda'),
    },
    {
      icon: <Ionicons name="create" size={24} color="#666" />,
      text: 'Configurar Perfil DJ',
      onPress: () => router.push({
        pathname: '/editar-perfil',
        params: { type: 'dj' }
      }),
    },
    {
      icon: <BriefcaseIcon />,
      text: 'Gestionar Portafolio',
      onPress: () => router.push('/apartado-dj-portafolio'),
    },
    {
      icon: <Ionicons name="images" size={24} color="#666" />,
      text: 'Galería de Fotos',
      onPress: () => router.push('/galeria-dj'),
    },
    {
      icon: <Ionicons name="star" size={24} color="#666" />,
      text: 'Mis Reseñas',
      onPress: () => router.push('/reviews'),
    },
    {
      icon: <Ionicons name="card" size={24} color="#666" />,
      text: 'Métodos de Pago',
      onPress: () => Alert.alert('Próximamente', 'Gestiona tus métodos de pago'),
    },
    {
      icon: <Ionicons name="settings" size={24} color="#666" />,
      text: 'Configuración',
      onPress: () => router.push('/configuracion'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header with Profile Card */}
        <View style={styles.profileCardContainer}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <TouchableOpacity 
                style={styles.avatarContainer} 
                disabled={true}
                activeOpacity={0.7}
              >
                <View style={styles.avatarCircle}>
                    <Svg width={60} height={60} viewBox="0 0 24 24" fill="#5B7EFF">
                      <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <Path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
                      <Path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                    </Svg>
                </View>
                {/* Camera Icon Badge */}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>Usuario</Text>
                <Text style={styles.userSubtitle}>DJ Premium</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity 
              style={styles.editProfileBtn}
              onPress={() => router.push({
                pathname: '/editar-perfil',
                params: { type: 'dj' }
              })}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
              <Text style={styles.editProfileBtnText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSections}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            <View style={styles.sectionContent}>
              {menuItems.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItemModern}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconWrapper}>
                    {item.icon}
                  </View>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemTextModern}>{item.text}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.text === 'Notificaciones' && unread > 0 && (
                      <View style={styles.badgeModern}>
                        <Text style={styles.badgeTextModern}>{unread}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DJ Section - Gestión */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestión DJ</Text>
            <View style={styles.sectionContent}>
              {menuItems.slice(3, 7).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItemModern}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconWrapper}>
                    {item.icon}
                  </View>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemTextModern}>{item.text}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.sectionContent}>
              {menuItems.slice(7).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItemModern}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconWrapper}>
                    {item.icon}
                  </View>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemTextModern}>{item.text}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <TouchableOpacity
                style={[styles.menuItemModern, styles.dangerItem]}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.menuIconWrapper, styles.dangerIconWrapper]}>
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.dangerText}>Eliminar cuenta</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ff4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItemModern, styles.dangerItem]}
                onPress={handleLogout}
              >
                <View style={[styles.menuIconWrapper, styles.dangerIconWrapper]}>
                  <Ionicons name="log-out" size={20} color="#ff4444" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.dangerText}>Cerrar Sesión</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar 
        activeTab="apartadomasdj"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Modern Profile Card Section
  profileCardContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#5B7EFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5B7EFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userSubtitle: {
    color: '#5B7EFF',
    fontSize: 13,
    fontWeight: '600',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  editProfileBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Menu Sections
  menuSections: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  sectionContent: {
    gap: 8,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  menuItemModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIconWrapper: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTextModern: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeModern: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTextModern: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  // Legacy styles for compatibility
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutItem: {
    marginTop: 20,
  },
  userRole: {
    color: '#999',
    fontSize: 16,
  },
});
