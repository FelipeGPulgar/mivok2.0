import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getUserProfile, signOut, updateUserNames, UserProfile } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Funciones de escalado
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const fp = (percentage: number) => {
  const baseWidth = 375; // referencia iPhone X
  return (width / baseWidth) * percentage;
};

// 🎨 Gradientes oscuros con transiciones suaves
const gradients: [string, string][] = [
  ['#1a1a2e', '#16213e'],
  ['#16213e', '#0f3460'],
  ['#0f3460', '#533a7b'],
  ['#533a7b', '#2c1810'],
  ['#2c1810', '#1f2937'],
  ['#1f2937', '#374151'],
  ['#374151', '#1a1a2e'],
];

// 🌈 Degradados para botones
const buttonGradients = {
  logout: ['#ef4444', '#dc2626'] as [string, string],
  save: ['#10b981', '#059669'] as [string, string],
  edit: ['#3b82f6', '#2563eb'] as [string, string],
  skip: [
    'rgba(255, 255, 255, 0.15)',
    'rgba(255, 255, 255, 0.05)',
    'rgba(255, 255, 255, 0.1)',
  ] as [string, string, string],
};

// 🌌 Partículas flotantes mejoradas
const NUM_PARTICLES = 25;

interface ParticleProps {
  index: number;
}

const Particle = React.memo(({ index }: ParticleProps) => {
  const animatedValues = useRef({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(height + Math.random() * 100),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5 + Math.random() * 0.5),
  }).current;

  const particleConfig = useRef({
    size: 1.5 + Math.random() * 3,
    speed: 8000 + Math.random() * 4000,
    delay: index * 300 + Math.random() * 2000,
    horizontalDrift: (Math.random() - 0.5) * width * 0.3,
  }).current;

  const isAnimating = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const createParticleAnimation = React.useCallback(() => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    
    // Reset inicial con posición X aleatoria
    const startX = Math.random() * width;
    animatedValues.x.setValue(startX);
    animatedValues.y.setValue(height + 50 + Math.random() * 100);
    animatedValues.opacity.setValue(0);
    
    const endX = startX + particleConfig.horizontalDrift;
    
    animationRef.current = Animated.parallel([
      // Movimiento vertical
      Animated.timing(animatedValues.y, {
        toValue: -100,
        duration: particleConfig.speed,
        useNativeDriver: true,
      }),
      
      // Movimiento horizontal sutil
      Animated.timing(animatedValues.x, {
        toValue: Math.max(0, Math.min(width, endX)),
        duration: particleConfig.speed,
        useNativeDriver: true,
      }),
      
      // Animación de opacidad más suave
      Animated.sequence([
        Animated.timing(animatedValues.opacity, {
          toValue: 0.6 + Math.random() * 0.4,
          duration: particleConfig.speed * 0.2,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues.opacity, {
          toValue: 0.3 + Math.random() * 0.3,
          duration: particleConfig.speed * 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues.opacity, {
          toValue: 0,
          duration: particleConfig.speed * 0.2,
          useNativeDriver: true,
        }),
      ]),
      
      // Escala sutil
      Animated.sequence([
        Animated.timing(animatedValues.scale, {
          toValue: 0.8 + Math.random() * 0.4,
          duration: particleConfig.speed * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues.scale, {
          toValue: 0.3 + Math.random() * 0.3,
          duration: particleConfig.speed * 0.7,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationRef.current.start((finished) => {
      isAnimating.current = false;
      if (finished) {
        // Pequeña pausa antes de reiniciar
        setTimeout(() => {
          if (!isAnimating.current) {
            createParticleAnimation();
          }
        }, Math.random() * 1000);
      }
    });
  }, [animatedValues, particleConfig]);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      createParticleAnimation();
    }, particleConfig.delay);

    return () => {
      clearTimeout(initialDelay);
      if (animationRef.current) {
        animationRef.current.stop();
      }
      isAnimating.current = false;
    };
  }, [createParticleAnimation, particleConfig.delay]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particleConfig.size,
          height: particleConfig.size,
          borderRadius: particleConfig.size / 2,
          transform: [
            { translateX: animatedValues.x },
            { translateY: animatedValues.y },
            { scale: animatedValues.scale },
          ],
          opacity: animatedValues.opacity,
        },
      ]}
    />
  );
});

Particle.displayName = 'Particle';

interface WelcomeScreenProps {
  user: any;
  onSignOut?: () => void;
}

export default function WelcomeScreen({ user, onSignOut }: WelcomeScreenProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  // Estados para el perfil del usuario
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let animationTimeout: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const startAnimation = () => {
      if (isAnimating) return;
      setIsAnimating(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prev) => (prev + 1) % gradients.length);

        requestAnimationFrame(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }).start(() => {
            setIsAnimating(false);
          });
        });
      });
    };

    animationTimeout = setTimeout(() => {
      startAnimation();
    }, 2000);

    intervalId = setInterval(() => {
      startAnimation();
    }, 10000);

    return () => {
      if (animationTimeout) clearTimeout(animationTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fadeAnim, isAnimating]);

  // Cargar perfil del usuario
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;
    
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);
      
      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        
        // Si no tiene nombres, activar modo edición automáticamente
        if (!profile.first_name || !profile.last_name) {
          setIsEditing(true);
        }
      } else {
        // Si no existe perfil, activar modo edición
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // 🔥 FUNCIÓN PARA CERRAR SESIÓN
  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (!result.success) {
        Alert.alert('Error', result.error || 'Error cerrando sesión');
      } else {
        onSignOut?.();
      }
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      Alert.alert('Error', 'Error cerrando sesión');
    }
  };

  // Función para guardar nombres
  const handleSaveNames = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu nombre y apellido');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserNames(user.id, firstName.trim(), lastName.trim());
      
      if (result.success) {
        Alert.alert('¡Éxito!', 'Tu información ha sido guardada correctamente');
        setIsEditing(false);
        // Recargar perfil para obtener datos actualizados
        await loadUserProfile();
      } else {
        Alert.alert('Error', result.error || 'No se pudo guardar la información');
      }
    } catch (error) {
      console.error('Error guardando nombres:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Función para activar modo edición
  const handleEditNames = () => {
    setIsEditing(true);
    setFirstName(userProfile?.first_name || '');
    setLastName(userProfile?.last_name || '');
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFirstName(userProfile?.first_name || '');
    setLastName(userProfile?.last_name || '');
  };

  const nextIndex = (currentIndex + 1) % gradients.length;

  // Generar partículas con keys estables
  const particles = React.useMemo(() => 
    Array.from({ length: NUM_PARTICLES }, (_, i) => (
      <Particle key={`particle-${i}`} index={i} />
    )), []
  );

  // Obtener nombre completo para mostrar
  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    return user?.email || 'Usuario';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background base */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={gradients[currentIndex]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
      </View>

      {/* Background transición */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: fadeAnim, zIndex: isAnimating ? 1 : -1 },
        ]}
      >
        <LinearGradient
          colors={gradients[nextIndex]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
      </Animated.View>

      {/* Partículas */}
      <View style={styles.particlesContainer} pointerEvents="none">
        {particles}
      </View>

      {/* Información del usuario logueado */}
      <View style={styles.userInfo}>
        <Text style={styles.userText}>{user?.email}</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <LinearGradient
            colors={buttonGradients.logout}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutButtonGradient}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenido principal - Pantalla de bienvenida */}
        <View style={styles.loggedInContent}>
          <Text style={styles.welcomeText}>¡Bienvenido a Mivok!</Text>
          
          {profileLoading ? (
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          ) : (
            <>
              {/* Sección del perfil */}
              <View style={styles.profileSection}>
                <Text style={styles.profileTitle}>Tu Perfil</Text>
                
                {!isEditing ? (
                  // Vista de solo lectura
                  <View style={styles.profileDisplay}>
                    <Text style={styles.displayName}>{getDisplayName()}</Text>
                    <Text style={styles.userEmailText}>{user?.email}</Text>
                    <Text style={styles.providerText}>
                      Conectado con {userProfile?.provider || 'OAuth'}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.editButtonContainer} 
                      onPress={handleEditNames}
                    >
                      <LinearGradient
                        colors={buttonGradients.edit}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.editButton}
                      >
                        <Ionicons name="pencil" size={fp(16)} color="#fff" />
                        <Text style={styles.editButtonText}>Editar Perfil</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Vista de edición
                  <View style={styles.profileForm}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Nombre</Text>
                      <TextInput
                        style={styles.textInput}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Ingresa tu nombre"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        maxLength={50}
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Apellido</Text>
                      <TextInput
                        style={styles.textInput}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Ingresa tu apellido"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        maxLength={50}
                      />
                    </View>
                    
                    <View style={styles.formButtons}>
                      <TouchableOpacity 
                        style={styles.formButtonContainer} 
                        onPress={handleSaveNames}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={buttonGradients.save}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.formButton, loading && { opacity: 0.7 }]}
                        >
                          <Ionicons name="checkmark" size={fp(16)} color="#fff" />
                          <Text style={styles.formButtonText}>
                            {loading ? 'Guardando...' : 'Guardar'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      {userProfile?.first_name && (
                        <TouchableOpacity 
                          style={styles.formButtonContainer} 
                          onPress={handleCancelEdit}
                        >
                          <LinearGradient
                            colors={buttonGradients.skip}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.formButton}
                          >
                            <Ionicons name="close" size={fp(16)} color="#fff" />
                            <Text style={styles.formButtonText}>Cancelar</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
              
              <Text style={styles.successText}>Has iniciado sesión correctamente 🎉</Text>
            </>
          )}
          
          {/* Botón adicional para explorar la app */}
          <TouchableOpacity
            style={styles.exploreButtonContainer}
            onPress={() => router.push('/BienvenidaScreen')}
          >
            <LinearGradient
              colors={buttonGradients.skip}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exploreButton}
            >
              <Text style={styles.exploreButtonText}>Explorar la App</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  
  scrollContainer: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // PARTÍCULAS
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },

  // USER INFO
  userInfo: {
    position: 'absolute',
    top: hp(5),
    right: wp(5),
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: wp(3),
    borderRadius: wp(2),
    zIndex: 20,
    maxWidth: wp(60),
  },
  userText: {
    color: '#fff',
    fontSize: fp(11),
    fontWeight: '600',
  },

  // LOGOUT BUTTON
  logoutButton: {
    marginTop: hp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  logoutButtonGradient: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(4),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: fp(12),
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // LOGGED IN CONTENT - PANTALLA DE BIENVENIDA
  loggedInContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingTop: hp(10),
    paddingBottom: hp(5),
  },
  welcomeText: {
    fontSize: fp(32),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: hp(3),
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    fontFamily: 'Salezar',
  },
  
  // LOADING
  loadingText: {
    color: '#fff',
    fontSize: fp(16),
    fontWeight: '600',
    opacity: 0.8,
  },
  
  // PROFILE SECTION
  profileSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(4),
    padding: wp(5),
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileTitle: {
    fontSize: fp(20),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: hp(2),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // PROFILE DISPLAY
  profileDisplay: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: fp(24),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: hp(1),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userEmailText: {
    fontSize: fp(16),
    color: '#fff',
    textAlign: 'center',
    marginBottom: hp(1),
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  providerText: {
    fontSize: fp(14),
    color: '#fff',
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: hp(2),
    fontStyle: 'italic',
  },
  
  // EDIT BUTTON
  editButtonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: wp(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  editButtonText: {
    color: '#fff',
    fontSize: fp(14),
    fontWeight: '700',
    marginLeft: wp(2),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // PROFILE FORM
  profileForm: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: hp(2),
  },
  inputLabel: {
    color: '#fff',
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(0.5),
    marginLeft: wp(1),
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: wp(3),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    color: '#fff',
    fontSize: fp(16),
    fontWeight: '500',
  },
  
  // FORM BUTTONS
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: hp(2),
  },
  formButtonContainer: {
    flex: 1,
    marginHorizontal: wp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  formButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: wp(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formButtonText: {
    color: '#fff',
    fontSize: fp(14),
    fontWeight: '700',
    marginLeft: wp(1),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  successText: {
    fontSize: fp(16),
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: hp(2),
  },

  // BOTÓN EXPLORAR
  exploreButtonContainer: {
    marginTop: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  exploreButton: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: fp(16),
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});