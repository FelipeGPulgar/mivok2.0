import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { checkEmailProvider, deleteUserAccount, supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Responsive utility functions
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const fp = (percentage: number) => (width / 375) * percentage;

// Gradientes oscuros con transiciones suaves (igual que index.tsx)
const backgroundGradients: [string, string][] = [
  ['#1a1a2e', '#16213e'],
  ['#16213e', '#0f3460'],
  ['#0f3460', '#533a7b'],
  ['#533a7b', '#2c1810'],
  ['#2c1810', '#1f2937'],
  ['#1f2937', '#374151'],
  ['#374151', '#1a1a2e'],
];

const NUM_PARTICLES = 12;

interface ParticleProps {
  index: number;
}

const Particle = React.memo(({ index }: ParticleProps) => {
  const animatedValues = React.useRef({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(height + Math.random() * 100),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5 + Math.random() * 0.5),
  }).current;

  const particleConfig = React.useRef({
    size: 1.5 + Math.random() * 3,
    speed: 8000 + Math.random() * 4000,
    delay: index * 300 + Math.random() * 2000,
    horizontalDrift: (Math.random() - 0.5) * width * 0.3,
  }).current;

  const isAnimating = React.useRef(false);
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);

  const createParticleAnimation = React.useCallback(() => {
    if (isAnimating.current) return;

    isAnimating.current = true;

    const startX = Math.random() * width;
    animatedValues.x.setValue(startX);
    animatedValues.y.setValue(height + 50 + Math.random() * 100);
    animatedValues.opacity.setValue(0);

    const endX = startX + particleConfig.horizontalDrift;

    animationRef.current = Animated.parallel([
      Animated.timing(animatedValues.y, {
        toValue: -100,
        duration: particleConfig.speed,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues.x, {
        toValue: Math.max(0, Math.min(width, endX)),
        duration: particleConfig.speed,
        useNativeDriver: true,
      }),
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
        {
          position: 'absolute',
          width: particleConfig.size,
          height: particleConfig.size,
          borderRadius: particleConfig.size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          shadowColor: '#fff',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 3,
          elevation: 5,
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

export default function LoginEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  // Sistema de partículas flotantes (igual que index.tsx)
  const generateParticles = () => {
    return Array.from({ length: NUM_PARTICLES }, (_, index) => (
      <Particle key={index} index={index} />
    ));
  };

  const particles = React.useMemo(() => generateParticles(), []);

  // Función de login con email
  const handleEmailLogin = async () => {
    if (loading) return;

    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);

    try {
      // Primero verificar si el email ya existe con otro provider
      const emailCheck = await checkEmailProvider(email);

      if (emailCheck.error) {
        Alert.alert('Error', 'No se pudo verificar el email. Intenta nuevamente.');
        setLoading(false);
        return;
      }

      if (emailCheck.exists && emailCheck.provider && emailCheck.provider !== 'email') {
        // Email ya existe con Google o Microsoft
        const providerName = emailCheck.provider === 'google' ? 'Google' :
          emailCheck.provider === 'microsoft' ? 'Microsoft' :
            emailCheck.provider;

        Alert.alert(
          '⚠️ Cuenta ya registrada',
          `Este email ya está registrado con ${providerName}.\n\n¿Qué te gustaría hacer?`,
          [
            {
              text: '🔙 Volver al login',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
                router.back();
              }
            },
            {
              text: '🗑️ Eliminar y continuar',
              style: 'destructive',
              onPress: async () => {
                console.log('🗑️ Usuario eligió eliminar cuenta existente');

                const deleteResult = await deleteUserAccount(email);

                if (deleteResult.success) {
                  Alert.alert(
                    '✅ Cuenta eliminada',
                    'La cuenta anterior fue eliminada. Ahora puedes crear una nueva cuenta con email y contraseña.',
                    [{ text: 'Continuar', onPress: () => proceedWithEmailLogin() }]
                  );
                } else {
                  Alert.alert('Error', 'No se pudo eliminar la cuenta anterior. Intenta nuevamente.');
                  setLoading(false);
                }
              }
            }
          ]
        );
        return;
      }

      // Si el email no existe o ya es de tipo email, proceder normalmente
      await proceedWithEmailLogin();

    } catch (error: any) {
      console.error('❌ Error inesperado en verificación:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
      setLoading(false);
    }
  };

  // Función para registrarse (cuando no tiene cuenta)
  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // 🔥 NUEVO: Primero verificar si el email ya existe
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (existingProfile) {
        // El email ya existe, intentar iniciar sesión
        console.log('📧 Email ya registrado, intentando iniciar sesión...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });

        if (signInError) {
          // Error al iniciar sesión (probablemente contraseña incorrecta)
          Alert.alert(
            'Email ya registrado',
            'Este email ya tiene una cuenta, pero la contraseña es incorrecta. Por favor verifica tu contraseña.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }

        // Login exitoso
        console.log('✅ Login exitoso con email existente');
        Alert.alert('¡Bienvenido de nuevo!', 'Has iniciado sesión correctamente', [
          {
            text: 'OK',
            onPress: () => {
              // Redirigir a home-cliente por defecto
              router.replace('/home-cliente');
            }
          }
        ]);
        return;
      }

      // El email NO existe, proceder con el registro
      console.log('📝 Email nuevo, creando cuenta...');

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (signUpError) {
        console.error('❌ Error en signUp:', signUpError);
        Alert.alert('Error', `No se pudo crear la cuenta: ${signUpError.message}`);
        setLoading(false);
        return;
      }

      if (!signUpData.user) {
        Alert.alert('Error', 'No se pudo crear el usuario');
        setLoading(false);
        return;
      }

      console.log('✅ Usuario creado en Auth:', signUpData.user.id);

      // Crear perfil en user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: signUpData.user.id,
          email: email.trim().toLowerCase(),
          first_name: '',
          is_dj: false
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError);
        Alert.alert('Error', 'No se pudo crear el perfil de usuario');
        setLoading(false);
        return;
      }

      console.log('✅ Perfil creado:', profileData);

      // Redirigir a registro de cliente
      Alert.alert(
        '¡Cuenta creada!',
        'Tu cuenta ha sido creada exitosamente. Ahora completa tu perfil.',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/registro-cliente')
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error en handleRegister:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para proceder solo con LOGIN (no registro)
  const proceedWithEmailLogin = async () => {
    try {
      // Verificar si la cuenta existe en user_profiles con provider 'email'
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('provider', 'email')
        .limit(1);

      if (profileError) {
        console.error('❌ Error verificando perfil:', profileError);
        Alert.alert('Error', 'No se pudo verificar la cuenta. Intenta nuevamente.');
        return;
      }

      if (profiles && profiles.length > 0) {
        router.replace('/home-cliente');
      } else {
        Alert.alert(
          'Cuenta no encontrada',
          'No existe una cuenta con este email. ¿Te gustaría crear una?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => setLoading(false)
            },
            {
              text: 'Crear cuenta',
              onPress: () => {
                setIsRegistering(true);
                setLoading(false);
              }
            }
          ]
        );
      }

    } catch (error: any) {
      console.error('❌ Error inesperado en login:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setGradientIndex((prev) => (prev + 1) % backgroundGradients.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background animado */}
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={backgroundGradients[gradientIndex]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
      </Animated.View>

      {/* Partículas flotantes */}
      <View style={styles.particlesContainer} pointerEvents="none">
        {particles}
      </View>

      {/* Header con botón de regreso */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={fp(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inicia Sesión</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>
            {isRegistering ? '¡Crea tu cuenta! 🎉' : '¡Bienvenido de vuelta! 👋'}
          </Text>
          <Text style={styles.subtitleText}>
            {isRegistering ? 'Completa los datos para registrarte' : 'Ingresa tus credenciales para continuar'}
          </Text>

          {/* Input de Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={fp(20)} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tu email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              accessible={true}
              accessibilityLabel="Campo de email"
            />
          </View>

          {/* Input de Contraseña */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={fp(20)} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tu contraseña"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              accessible={true}
              accessibilityLabel="Campo de contraseña"
            />
          </View>

          {/* Input de Confirmar Contraseña - Solo en registro */}
          {isRegistering && (
            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-circle-outline" size={fp(20)} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirma tu contraseña"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                accessible={true}
                accessibilityLabel="Campo de confirmación de contraseña"
              />
            </View>
          )}

          {/* Botón de olvido de contraseña - Solo en login */}
          {!isRegistering && (
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => router.push('/recuperar-password')}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

          {/* Botón principal */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={isRegistering ? handleRegister : handleEmailLogin}
            disabled={loading || !email || !password || (isRegistering && !confirmPassword)}
          >
            <LinearGradient
              colors={loading || !email || !password || (isRegistering && !confirmPassword)
                ? ['#ccc', '#999']
                : ['#667eea', '#764ba2']}
              style={styles.loginGradient}
            >
              <Text style={styles.loginButtonText}>
                {loading ? '⏳ Procesando...' :
                  isRegistering ? '🚀 Crear Cuenta' : '🚀 Iniciar Sesión'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botón para cambiar entre login y registro */}
          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => {
              setIsRegistering(!isRegistering);
              setConfirmPassword('');
            }}
          >
            <Text style={styles.switchModeText}>
              {isRegistering
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate aquí'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(4),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  backButton: {
    width: fp(44),
    height: fp(44),
    borderRadius: fp(22),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: fp(44),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: wp(6),
    padding: wp(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: fp(28),
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subtitleText: {
    fontSize: fp(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: wp(3),
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
    height: hp(6.5),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: wp(3),
  },
  input: {
    flex: 1,
    fontSize: fp(16),
    color: '#333',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: hp(3),
  },
  forgotText: {
    fontSize: fp(14),
    color: '#667eea',
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: hp(2),
  },
  loginGradient: {
    height: hp(6.5),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: fp(18),
    fontWeight: '600',
    color: '#fff',
  },
  autoRegisterText: {
    fontSize: fp(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: fp(20),
  },
  switchModeButton: {
    marginTop: hp(2),
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: fp(14),
    color: '#667eea',
    fontWeight: '500',
    textAlign: 'center',
  },
});