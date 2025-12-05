import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import { useColorScheme } from '../hooks/useColorScheme';
import * as profileFunctions from '../lib/profile-functions';
import { useRole } from '../lib/RoleContext';
import { setCurrentUserMode } from '../lib/user-mode-functions';

interface SwitchSettingItem {
  icon: string;
  title: string;
  type: 'switch';
  value: boolean;
  onValueChange: (value: boolean) => Promise<void>;
  subtitle?: string;
}

interface NavigateSettingItem {
  icon: string;
  title: string;
  type: 'navigate';
  onPress: () => void;
  subtitle?: string;
}

type SettingItem = SwitchSettingItem | NavigateSettingItem;

interface SettingsSection {
  title: string;
  items: SettingItem[];
}

export default function ConfiguracionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDJ, isLoading, refreshMode } = useRole();
  const [hasDJProfile, setHasDJProfile] = useState<boolean | null>(null);

  const isDJMode = params.mode === 'dj' || (isDJ && params.mode !== 'client');
  
  // Debug: Verificar valores
  console.log('🔧 Configuración - isDJ:', isDJ, 'isDJMode:', isDJMode, 'params.mode:', params.mode, 'hasDJProfile:', hasDJProfile);
  
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Verificar directamente si el usuario tiene perfil DJ
  // Ejecutar siempre al montar y cuando cambie isDJ del contexto
  useEffect(() => {
    const checkDJProfile = async () => {
      try {
        console.log('🔍 Iniciando verificación de perfil DJ...');
        const djProfile = await profileFunctions.getCurrentDJProfile();
        const userIsDJ = !!djProfile;
        console.log('🔍 Resultado verificación DJ:', {
          userIsDJ,
          hasProfile: !!djProfile,
          profileId: djProfile?.id || 'N/A'
        });
        setHasDJProfile(userIsDJ);
      } catch (error) {
        console.error('❌ Error verificando perfil DJ:', error);
        setHasDJProfile(false);
      }
    };
    
    // Siempre verificar directamente, no confiar solo en el contexto
    checkDJProfile();
  }, [isDJ]); // Re-ejecutar si isDJ cambia

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@mivok/theme');
      const savedNotifications = await AsyncStorage.getItem('@mivok/notifications');
      const savedLocation = await AsyncStorage.getItem('@mivok/location');

      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
      if (savedNotifications) {
        setNotificationsEnabled(savedNotifications === 'true');
      }
      if (savedLocation) {
        setLocationEnabled(savedLocation === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const toggleTheme = async (value: boolean) => {
    setIsDarkMode(value);
    await saveSetting('@mivok/theme', value ? 'dark' : 'light');
    // Aquí podrías implementar la lógica para cambiar el tema global
    Alert.alert('Tema cambiado', `Modo ${value ? 'oscuro' : 'claro'} activado`);
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await saveSetting('@mivok/notifications', value.toString());
  };

  const toggleLocation = async (value: boolean) => {
    setLocationEnabled(value);
    await saveSetting('@mivok/location', value.toString());
  };

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

  const baseSettingsItems: SettingsSection[] = [
    {
      title: 'Notificaciones',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notificaciones push',
          type: 'switch',
          value: notificationsEnabled,
          onValueChange: toggleNotifications,
        }
      ]
    },
    {
      title: 'Privacidad',
      items: [
        {
          icon: 'location-outline',
          title: 'Ubicación',
          subtitle: 'Permitir acceso a ubicación para mejores recomendaciones',
          type: 'switch',
          value: locationEnabled,
          onValueChange: toggleLocation,
        },
        {
          icon: 'shield-outline',
          title: 'Privacidad de datos',
          subtitle: 'Gestiona cómo usamos tu información',
          type: 'navigate',
          onPress: () => Alert.alert('Próximamente', 'Funcionalidad en desarrollo'),
        }
      ]
    },
    {
      title: 'Cuenta',
      items: [
        {
          icon: 'person-outline',
          title: 'Cambiar contraseña',
          type: 'navigate',
          onPress: () => Alert.alert(
            'Cambiar contraseña',
            'Recuerda que nosotros no manejamos tus contraseñas, de eso se encarga Google 😉',
            [{ text: 'Entendido', style: 'default' }]
          ),
        },
        {
          icon: 'mail-outline',
          title: 'Cambiar email',
          type: 'navigate',
          onPress: () => Alert.alert('Próximamente', 'Funcionalidad en desarrollo'),
        },
        {
          icon: 'download-outline',
          title: 'Exportar datos',
          subtitle: 'Descarga una copia de tus datos',
          type: 'navigate',
          onPress: () => Alert.alert('Próximamente', 'Funcionalidad en desarrollo'),
        }
      ]
    },

    {
      title: 'Soporte',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Centro de ayuda',
          type: 'navigate',
          onPress: () => router.push({ pathname: '/ayuda', params: { mode: isDJMode ? 'dj' : 'client' } }),
        },
        {
          icon: 'information-circle-outline',
          title: 'Acerca de Mivok',
          type: 'navigate',
          onPress: () => Alert.alert('Mivok v1.0', 'Conectando DJs con clientes desde 2024'),
        }
      ]
    }
  ];

  // Agregar botón de cambiar modo si es DJ
  // Usar useMemo para recalcular cuando cambien los valores
  const userIsDJ = hasDJProfile === true || isDJ === true || params.mode === 'dj';
  
  console.log('🔧 Verificando si mostrar botón de cambio de modo:', {
    hasDJProfile,
    isDJ,
    paramsMode: params.mode,
    isDJMode,
    userIsDJ
  });
  
  // Construir settingsItems dinámicamente para que se actualice cuando cambien los estados
  const settingsItems = useMemo(() => {
    const items = [...baseSettingsItems];
    
    // SIEMPRE mostrar el botón si el usuario es DJ, sin importar el modo actual
    if (userIsDJ) {
      items.unshift({
      title: 'Modo de Aplicación',
      items: [
        {
          icon: isDJMode ? 'person-outline' : 'musical-notes-outline',
          title: isDJMode ? 'Cambiar a modo Cliente' : 'Cambiar a modo DJ',
          subtitle: isDJMode ? 'Ver la app como cliente' : 'Volver a gestionar mi perfil DJ',
          type: 'navigate',
          onPress: async () => {
            try {
              if (isDJMode) {
                // Cambiar a modo cliente
                console.log('🔄 Cambiando a modo cliente...');
                await setCurrentUserMode('cliente');
                await refreshMode();
                router.push('/home-cliente');
                console.log('✅ Cambio a modo cliente completado');
              } else {
                // Cambiar a modo DJ
                console.log('🔄 Cambiando a modo DJ...');
                await setCurrentUserMode('dj');
                await refreshMode();
                router.push('/home-dj');
                console.log('✅ Cambio a modo DJ completado');
              }
            } catch (error) {
              console.error('❌ Error al cambiar modo:', error);
              Alert.alert('Error', 'No se pudo cambiar el modo. Intenta de nuevo.');
            }
          },
        }
      ]
    });
      console.log('✅ Botón de cambio de modo AGREGADO - userIsDJ:', userIsDJ);
    } else {
      // 🔥 NUEVO: Mostrar opción para registrarse como DJ si no tiene perfil
      console.log('🔄 Usuario no es DJ, agregando opción de registro como DJ');
      items.unshift({
        title: 'Modo de Aplicación',
        items: [
          {
            icon: 'musical-notes-outline',
            title: 'Registrarse como DJ',
            subtitle: '¿Eres DJ? Crea tu perfil y ofrece tus servicios',
            type: 'navigate',
            onPress: async () => {
              try {
                console.log('🎵 Iniciando registro como DJ...');
                
                // Cargar datos del usuario para pre-llenar el registro
                const userData = await profileFunctions.loadUserDataWithFallbacks();
                console.log('📝 Datos del usuario para registro DJ:', {
                  nombre: userData.name,
                  email: userData.email || 'No disponible',
                  tieneImagen: !!userData.profileImage
                });
                
                // Navegar al registro DJ con los datos pre-cargados
                router.push({
                  pathname: '/registro-dj',
                  params: {
                    preFilledName: userData.name || '',
                    preFilledEmail: userData.email || '',
                    fromConfiguration: 'true'
                  }
                });
              } catch (error) {
                console.error('❌ Error preparando registro DJ:', error);
                router.push('/registro-dj');
              }
            },
          }
        ]
      });
      console.log('✅ Botón de registro como DJ AGREGADO para usuario email');
    }
    
    return items;
  }, [userIsDJ, isDJMode, router, notificationsEnabled, locationEnabled, isDJMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(isDJMode ? '/apartadodj' : '/apartadomascliente')}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingsItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name={item.icon as any} size={20} color="#5B7EFF" />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      {'subtitle' in item && item.subtitle && (
                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.settingRight}>
                    {item.type === 'switch' ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: '#333', true: '#5B7EFF' }}
                        thumbColor={item.value ? '#fff' : '#ccc'}
                      />
                    ) : (
                      <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={item.onPress}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Zona de peligro</Text>
          <View style={styles.dangerContent}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleDeleteAccount}
            >
              <View style={styles.dangerLeft}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
                <Text style={styles.dangerText}>Eliminar cuenta</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNavBar
        activeTab={isDJMode ? 'apartadomasdj' : 'apartadomascliente'}
        onHomePress={() => router.push(isDJMode ? '/home-dj' : '/home-cliente')}
        onEventosPress={() => router.push(isDJMode ? '/eventos-dj' : '/eventos-cliente' as any)}
        onSearchPress={() => router.push(isDJMode ? '/chats-dj' : '/chats-cliente')}
        onAlertasPress={() => router.push(isDJMode ? '/alertas-dj' : '/alertas-cliente')}
        onMasPress={() => router.push(isDJMode ? '/apartadodj' : '/apartadomascliente')}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  navigateButton: {
    padding: 4,
  },
  dangerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  dangerTitle: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dangerContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dangerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
