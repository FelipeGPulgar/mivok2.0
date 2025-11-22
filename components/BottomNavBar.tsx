import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNotifications } from '../lib/NotificationContext';

// Iconos - dinámicos con color parametrizable
function HomeIcon({ color = '#999' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <Path d="M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-1v-7a3 3 0 0 0 -2.824 -2.995l-.176 -.005h-2a3 3 0 0 0 -3 3v7h-1a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.293 11.707a1 1 0 0 1 1 1v7h-4v-7a1 1 0 0 1 .883 -.993l.117 -.007z" fill={color} />
    </Svg>
  );
}

function CalendarIcon({ color = '#999' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <Path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
      <Path d="M16 3v4" />
      <Path d="M8 3v4" />
      <Path d="M4 11h16" />
      <Path d="M7 14h.013" />
      <Path d="M10.01 14h.005" />
      <Path d="M13.01 14h.005" />
      <Path d="M16.015 14h.005" />
      <Path d="M13.015 17h.005" />
      <Path d="M7.01 17h.005" />
      <Path d="M10.01 17h.005" />
    </Svg>
  );
}

function SearchIcon({ color = '#fff' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <Path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <Path d="M21 21l-6 -6" />
    </Svg>
  );
}

// 💬 Ícono de mensajes reemplazando búsqueda
function MessagesIcon({ color = '#fff' }) {
  return (
    <Text style={{ fontSize: 24, color }}>💬</Text>
  );
}

function BellIcon({ color = '#999' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <Path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a1 1 0 0 0 1 1h1a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h1a1 1 0 0 0 1 -1v-3a7 7 0 0 1 4 -6" />
      <Path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </Svg>
  );
}

function MenuIcon({ color = '#999' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <Path d="M4 6l16 0" />
      <Path d="M4 12l16 0" />
      <Path d="M4 18l16 0" />
    </Svg>
  );
}

// Componente de botón animado
function AnimatedNavButton({ 
  icon: Icon, 
  label, 
  isActive, 
  onPress,
  badgeCount = 0
}: { 
  icon: React.ComponentType<any>; 
  label: string; 
  isActive: boolean; 
  onPress: () => void;
  badgeCount?: number;
}) {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacityAnim, {
      toValue: 0.85,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={[
        styles.navItemWrapper,
        isActive && styles.navItemWrapperActive,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.navItemContent,
          { opacity: opacityAnim },
        ]}
      >
        <View style={{ position: 'relative' }}>
          <Icon color={isActive ? '#fff' : '#999'} />
          {badgeCount > 0 && (
            <View style={styles.iconBadge}>
              <View style={styles.iconBadgeDot} />
            </View>
          )}
        </View>
        <Text style={isActive ? styles.navTextActive : styles.navText}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface BottomNavBarProps {
  activeTab?: 'inicio' | 'eventos' | 'mensajes' | 'alertas' | 'mas' | 'apartadomascliente' | 'apartadomasdj';
  onHomePress?: () => void;
  onEventosPress?: () => void;
  onSearchPress?: () => void;
  onAlertasPress?: () => void;
  onMasPress?: () => void;
  unreadCount?: number;
}

export default function BottomNavBar({
  activeTab = 'inicio',
  onHomePress = () => {},
  onEventosPress = () => {},
  onSearchPress = () => {},
  onAlertasPress = () => {},
  onMasPress = () => {},
  unreadCount = 0,
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // 🔥 Usar el contexto de notificaciones para obtener el contador global
  const { unreadCount: globalUnreadCount } = useNotifications();
  
  // Preferir el contador global si está disponible
  const finalUnreadCount = globalUnreadCount > 0 ? globalUnreadCount : unreadCount;
  
  // 🔴 Logging para debugging
  console.log(`🎨 BottomNavBar renderizado - finalUnreadCount: ${finalUnreadCount}, globalUnreadCount: ${globalUnreadCount}`);

  const navigateRoleAware = useCallback(async (djRoute: string, clientRoute: string) => {
    try {
      const flag = await AsyncStorage.getItem('@mivok/is_dj_registered');
      const isDJ = flag === 'true';
      const target = isDJ ? djRoute : clientRoute;
      router.push(target as any);
    } catch (e) {
      // Fallback por si falla AsyncStorage
      router.push(clientRoute as any);
    }
  }, [router]);

  // Fallbacks: si no vienen handlers, usar navegación estándar
  const handleHome = onHomePress && onHomePress.toString() !== (() => {}).toString()
    ? onHomePress
    : () => navigateRoleAware('/home-dj', '/home-cliente');

  const handleEventos = onEventosPress && onEventosPress.toString() !== (() => {}).toString()
    ? onEventosPress
    : () => navigateRoleAware('/eventos-dj', '/eventos-cliente');

  const handleMensajes = onSearchPress && onSearchPress.toString() !== (() => {}).toString()
    ? onSearchPress
    : () => navigateRoleAware('/chats-dj', '/chats-cliente');

  const handleAlertas = onAlertasPress && onAlertasPress.toString() !== (() => {}).toString()
    ? onAlertasPress
    : () => navigateRoleAware('/alertas-dj', '/alertas-cliente');

  const handleMas = onMasPress && onMasPress.toString() !== (() => {}).toString()
    ? onMasPress
    : () => navigateRoleAware('/apartadodj', '/apartadomascliente');

  return (
    <View style={[styles.bottomNavWrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.bottomNav}>
        <AnimatedNavButton 
          icon={HomeIcon}
          label="Inicio"
          isActive={activeTab === 'inicio'}
          onPress={handleHome}
        />

        <AnimatedNavButton 
          icon={CalendarIcon}
          label="Eventos"
          isActive={activeTab === 'eventos'}
          onPress={handleEventos}
        />

        <View style={styles.navItemCenter}>
          <View style={styles.navCircleContainer}>
            <TouchableOpacity 
              style={styles.navCircle}
              onPress={handleMensajes}
            >
              <MessagesIcon />
            </TouchableOpacity>
          </View>
        </View>

        <AnimatedNavButton 
          icon={BellIcon}
          label="Alertas"
          isActive={activeTab === 'alertas'}
          onPress={handleAlertas}
          badgeCount={finalUnreadCount}
        />

        <AnimatedNavButton 
          icon={MenuIcon}
          label="Más"
          isActive={activeTab === 'mas' || activeTab === 'apartadomascliente' || activeTab === 'apartadomasdj'}
          onPress={handleMas}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavWrapper: {
    // Natural flow: part of the layout, not absolute positioned
    // This allows Android system navigation to work properly
    backgroundColor: '#1a1a1a',
    // RECTANGULAR - no border radius, straight edges
    borderRadius: 0,
    // FULL WIDTH - no margins or side padding that reduces width
    margin: 0,
    padding: 0,
    // Use paddingHorizontal inside bottomNav instead to keep icons centered
    overflow: 'visible',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    // No shadow for clean rectangular look
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  navItemWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  navItemWrapperActive: {
    backgroundColor: 'rgba(91, 126, 255, 0.15)',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  navTextActive: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navCircleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCircle: {
    backgroundColor: '#5B7EFF',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B7EFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 12,
  },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
});
