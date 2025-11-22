import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);

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

  const settingsItems: SettingsSection[] = [
    {
      title: 'Apariencia',
      items: [
        {
          icon: 'moon-outline',
          title: 'Modo oscuro',
          type: 'switch',
          value: isDarkMode,
          onValueChange: toggleTheme,
        }
      ]
    },
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
          onPress: () => Alert.alert('Próximamente', 'Funcionalidad en desarrollo'),
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
          onPress: () => router.push('/ayuda'),
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
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
        activeTab="apartadomascliente"
        onHomePress={() => router.push('/home-cliente')}
        onEventosPress={() => router.push('/eventos-cliente' as any)}
        onSearchPress={() => router.push('/chats-cliente')}
        onAlertasPress={() => router.push('/alertas-cliente')}
        onMasPress={() => {}}
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