import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { AnimatedBackground } from '../components/AnimatedBackground';
import { getCurrentUser, supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Funciones de escalado responsivo
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const fp = (percentage: number) => {
  const baseWidth = 375; // referencia iPhone X
  return (width / baseWidth) * percentage;
};

export default function RegistroCliente() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [apodo, setApodo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinuar = async () => {
    // Validar campos
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }
    if (!apellido.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu apellido');
      return;
    }
    if (!apodo.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu apodo favorito');
      return;
    }

    setLoading(true);
    
    try {
      // Obtener usuario actual
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'No se encontró información del usuario');
        setLoading(false);
        return;
      }

      console.log('💾 Guardando perfil del cliente...');
      
      // Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: nombre.trim(),
          last_name: apellido.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Error actualizando perfil en BD:', updateError);
        Alert.alert('Error', 'No se pudo guardar tu información en la base de datos');
        setLoading(false);
        return;
      } else {
        console.log('✅ Perfil actualizado en BD');
      }

      // También guardar datos localmente como respaldo
      const clientData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        apodo: apodo.trim(),
        timestamp: new Date().toISOString(),
      };

      // También guardar sesión temporal para usuarios email (sin OAuth)
      await AsyncStorage.multiSet([
        ['@mivok/current_user_name', nombre.trim()],
        ['@mivok/current_user_lastname', apellido.trim()],
        ['@mivok/current_user_apodo', apodo.trim()],
        ['@mivok/client_profile', JSON.stringify(clientData)],
        ['@mivok/email_user_session', JSON.stringify({ userId: user.id, email: user.email })]
      ]);
      
      console.log('✅ Datos guardados en AsyncStorage:', {
        nombre: nombre.trim(),
        apodo: apodo.trim(),
        sessionSaved: true
      });
      
      Alert.alert(
        '¡Perfil completado!',
        `¡Hola ${nombre}! Tu perfil está listo. ¡Ahora puedes buscar DJs increíbles!`,
        [{ 
          text: 'Continuar', 
          onPress: () => {
            // Usar replace para no poder volver atrás
            router.replace('/home-cliente');
          }
        }]
      );

    } catch (error) {
      console.error('Error guardando perfil:', error);
      Alert.alert('Error', 'No se pudo guardar tu información');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Título */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Busca tu próximo DJ</Text>
            </View>

            {/* Información Personal */}
            <View style={styles.formContainer}>
              {/* Campo Nombre */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>¿Cuál es tu nombre? <Text style={{color: '#FF6B6B'}}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
              </View>

              {/* Campo Apellido */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>¿Cuál es tu apellido? <Text style={{color: '#FF6B6B'}}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Tu apellido"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
              </View>

              {/* Campo Apodo */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Pon tu apodo de DJ <Text style={{color: '#FF6B6B'}}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={apodo}
                  onChangeText={setApodo}
                  placeholder="Tu apodo de DJ favorito"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Botón de acción */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.nextButton, loading && styles.buttonDisabled]} 
                onPress={handleContinuar}
                disabled={loading}
              >
                <Text style={styles.nextButtonText}>
                  {loading ? 'Guardando...' : '¡Listo para buscar DJs! 🎵'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(3),
    alignItems: 'center',
    paddingTop: hp(10),
  },
  titleContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    marginBottom: hp(1.5),
    width: '100%',
    maxWidth: wp(90),
    alignItems: 'center',
  },
  title: {
    fontSize: fp(22),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: hp(0.5),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fp(13),
    color: "#fff",
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  emoji: {
    fontSize: fp(13),
  },
  formContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
    width: '100%',
    maxWidth: wp(90),
    alignItems: 'center',
  },
  fieldContainer: {
    marginBottom: hp(2),
    width: '100%',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: fp(14),
    fontWeight: "600",
    color: "#fff",
    marginBottom: hp(0.3),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    width: '100%',
  },
  fieldSubtitle: {
    fontSize: fp(11),
    color: "#fff",
    opacity: 0.8,
    marginBottom: hp(0.6),
    textAlign: 'center',
    width: '100%',
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: wp(3),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    fontSize: fp(13),
    color: "#333",
    marginTop: hp(0.5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    maxWidth: wp(80),
  },
  dropdown: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: wp(3),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(0.5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    maxWidth: wp(80),
  },
  selectedEspecialidadesView: {
    flex: 1,
  },
  dropdownText: {
    fontSize: fp(13),
    color: "#666",
    flex: 1,
  },
  dropdownOptions: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: wp(2),
    marginTop: hp(0.5),
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.3)',
    zIndex: 1000,
    width: '100%',
    maxWidth: wp(80),
  },
  dropdownOption: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  dropdownOptionText: {
    fontSize: fp(13),
    color: "#333",
  },
  buttonsContainer: {
    gap: hp(1.5),
    marginTop: hp(2),
    width: '100%',
    maxWidth: wp(80),
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: "#fff",
    borderRadius: wp(6),
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(5),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    width: '100%',
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: wp(6),
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(5),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    width: '100%',
  },
  nextButtonText: {
    fontSize: fp(14),
    fontWeight: "700",
    color: "#333",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  backButtonText: {
    fontSize: fp(14),
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  multiSelectOption: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: wp(4),
    height: wp(4),
    borderRadius: wp(1),
    borderWidth: 1.5,
    borderColor: "#ccc",
    marginRight: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: fp(11),
    fontWeight: '700',
  },
  multiSelectText: {
    fontSize: fp(13),
    color: "#333",
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(1.2),
    gap: wp(1.5),
  },
  tag: {
    backgroundColor: '#4CAF50',
    borderRadius: wp(4),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  tagText: {
    fontSize: fp(11),
    color: '#fff',
    fontWeight: '500',
  },
  tagClose: {
    color: '#fff',
    fontSize: fp(16),
    fontWeight: '700',
  },
});

