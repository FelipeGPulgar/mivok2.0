import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from "react";
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole } from '../lib/RoleContext';
import { getCurrentUser, signOut } from '../lib/supabase';
import * as supabaseFunctions from '../lib/supabase-functions';
import { setCurrentUserMode } from '../lib/user-mode-functions';

const { width, height } = Dimensions.get('window');

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

  React.useEffect(() => {
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

export default function Bienvenida() {
  const router = useRouter();
  const { refreshMode } = useRole();
  const [checking, setChecking] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
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

  const nextIndex = (currentIndex + 1) % gradients.length;

  // Generar partículas con keys estables
  const particles = React.useMemo(() => 
    Array.from({ length: NUM_PARTICLES }, (_, i) => (
      <Particle key={`particle-${i}`} index={i} />
    )), []
  );

  const handleQuieroTrabajar = async () => {
    if (checking) return;
    
    setChecking(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Debes estar autenticado');
        router.replace('/');
        return;
      }

      console.log('🔍 Verificando si usuario es DJ...');
      
      // 🎭 Establecer modo DJ
      const modeSet = await setCurrentUserMode('dj');
      if (!modeSet) {
        console.warn('⚠️ No se pudo establecer modo DJ');
      } else {
        // Refrescar el contexto de roles
        await refreshMode();
      }

      // Verificar si ya tiene perfil de DJ en dj_profiles
      const djProfile = await supabaseFunctions.getDJProfile(user.id);
      
      if (djProfile) {
        // Ya está registrado como DJ, ir directo a home-dj
        console.log('✅ Usuario ya registrado como DJ');
        router.replace('/home-dj');
      } else {
        // No está registrado como DJ, ir al formulario de registro
        console.log('📝 Usuario no registrado como DJ, mostrar formulario');
        router.push('/registro-dj');
      }
    } catch (error) {
      console.error('❌ Error verificando registro DJ:', error);
      // En caso de error, permitir ir al registro
      router.push('/registro-dj');
    } finally {
      setChecking(false);
    }
  };

  const handleIniciarBuscarDJ = async () => {
    try {
      console.log('🔍 Estableciendo modo cliente...');
      
      // 🎭 Establecer modo cliente
      const modeSet = await setCurrentUserMode('cliente');
      if (!modeSet) {
        console.warn('⚠️ No se pudo establecer modo cliente');
      } else {
        // Refrescar el contexto de roles
        await refreshMode();
      }
      
      router.replace('/home-cliente');
    } catch (error) {
      console.error('❌ Error estableciendo modo cliente:', error);
      router.replace('/home-cliente');
    }
  };

  const handleVolver = async () => {
    try {
      console.log('🚪 Cerrando sesión y volviendo al inicio...');
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      // Aunque falle el cierre de sesión, volver al inicio
      router.replace('/');
    }
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

      {/* Contenido principal */}
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Encabezado */}
        <View style={{width: '100%', height: 260, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1}}>
          <View style={{flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 40}}>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Haz match con tu próximo evento. <Text style={styles.auriculares}>🎧</Text></Text>
            <Text style={styles.emoji}>👋</Text>
          </View>
        </View>

        {/* Botones */}
        <View style={[styles.content, {marginTop: 260}]}> 
          <TouchableOpacity style={styles.button} onPress={handleIniciarBuscarDJ}>
            <Text style={styles.buttonText}>Iniciar a buscar DJ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, checking && styles.buttonDisabled]} 
            onPress={handleQuieroTrabajar}
            disabled={checking}
          >
            <Text style={styles.buttonText}>
              {checking ? 'Verificando...' : 'Quiero trabajar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonLogout} onPress={handleVolver}>
            <Text style={styles.buttonLogoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Texto inferior */}
        <Text style={styles.footerText}>Dentro igual podrás cambiar el modo</Text>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  background: {
    flex: 1,
  },
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
  safeAreaContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#d1d1d1",
    marginTop: 6,
    fontWeight: "bold",
  },
  auriculares: {
    fontSize: 16,
  },
  emoji: {
    fontSize: 40,
    marginTop: 18,
  },
  content: {
    alignItems: "center",
    gap: 20,
    marginBottom: 40,
  },
  button: {
    width: 250,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonSmall: {
    width: 120,
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  buttonLogout: {
    width: 140,
    backgroundColor: "#ff4444",
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ff6666",
  },
  buttonLogoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  footerText: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 20,
  },
});