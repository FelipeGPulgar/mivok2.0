import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { sendPasswordResetEmail } from '../lib/email-service';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Función de responsive design
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const fp = (percentage: number) => (width / 375) * percentage;

export default function RecuperarPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Función para enviar código de recuperación
  const handleSendRecoveryCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    
    try {
      // Generar código de 6 dígitos
      const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Enviar email bonito con nuestro servicio
      const emailResult = await sendPasswordResetEmail(
        email.trim(),
        'Usuario', // En la realidad obtendrías el nombre del usuario
        recoveryCode
      );

      if (!emailResult.success) {
        Alert.alert('Error', emailResult.error || 'No se pudo enviar el email');
        return;
      }

      // También usar Supabase como respaldo
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'mivokapp://reset-password',
      });

      // No fallar si Supabase falla, el email custom ya se envió
      if (error) {
        console.log('⚠️ Supabase reset falló (pero email custom se envió):', error);
      }

      setCodeSent(true);
      Alert.alert(
        '✅ ¡Email enviado!', 
        `Hemos enviado un hermoso email con tu código de recuperación a ${email}. 
        
¡Revisa tu bandeja de entrada! 📧✨`
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f3460', '#533a7b', '#2c1810']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={fp(24)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recuperar Contraseña</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={fp(80)} color="#667eea" />
          </View>

          {!codeSent ? (
            // Paso 1: Solicitar email
            <>
              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitle}>
                No te preocupes, ingresa tu email y te enviaremos un enlace para 
                restablecer tu contraseña.
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={fp(20)} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSendRecoveryCode}
                disabled={loading || !email}
              >
                <LinearGradient
                  colors={loading || !email ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>
                    {loading ? '📤 Enviando...' : '🚀 Enviar Enlace'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            // Paso 2: Confirmación
            <>
              <Text style={styles.title}>¡Enlace Enviado!</Text>
              <Text style={styles.subtitle}>
                Hemos enviado un enlace de recuperación a{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
                {'\n\n'}Revisa tu bandeja de entrada y haz clic en el enlace para 
                restablecer tu contraseña.
              </Text>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setCodeSent(false);
                  handleSendRecoveryCode();
                }}
                disabled={loading}
              >
                <Text style={styles.resendText}>
                  📧 Reenviar enlace
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Botón volver al login */}
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToLoginText}>
              ← Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(4),
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  backButton: {
    padding: wp(2),
  },
  headerTitle: {
    color: '#fff',
    fontSize: fp(18),
    fontWeight: '600',
  },
  placeholder: {
    width: wp(10),
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(6),
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  title: {
    color: '#fff',
    fontSize: fp(28),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fp(16),
    textAlign: 'center',
    lineHeight: fp(22),
    marginBottom: hp(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    marginBottom: hp(3),
  },
  inputIcon: {
    marginRight: wp(3),
  },
  input: {
    flex: 1,
    paddingVertical: hp(2),
    fontSize: fp(16),
    color: '#333',
  },
  submitButton: {
    marginBottom: hp(3),
  },
  submitGradient: {
    paddingVertical: hp(2),
    borderRadius: wp(4),
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitText: {
    color: '#fff',
    fontSize: fp(18),
    fontWeight: '700',
  },
  emailHighlight: {
    color: '#667eea',
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: hp(2),
    marginBottom: hp(4),
  },
  resendText: {
    color: '#667eea',
    fontSize: fp(16),
    fontWeight: '600',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  backToLoginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fp(16),
    fontWeight: '500',
  },
});