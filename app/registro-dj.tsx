import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
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
import * as supabaseFunctions from '../lib/supabase-functions';

const { width, height } = Dimensions.get('window');

// Funciones de escalado responsivo
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const fp = (percentage: number) => {
  const baseWidth = 375; // referencia iPhone X
  return (width / baseWidth) * percentage;
};

export default function RegistroDJ() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const DJ_FLAG_KEY = '@mivok/is_dj_registered';

  // Estado del formulario
  const [currentStep, setCurrentStep] = useState(1); // 1: nombre/apellido, 2: especialidades, 3: equipo/redes
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [apodoDJ, setApodoDJ] = useState('');
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [tieneEquipo, setTieneEquipo] = useState('');
  const [showEquipoDropdown, setShowEquipoDropdown] = useState(false);
  const [showEspecialidadesDropdown, setShowEspecialidadesDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔥 NUEVO: Pre-llenar datos cuando venimos de configuración
  useEffect(() => {
    if (params.fromConfiguration && params.preFilledName && nombre === '') {
      console.log('🎵 Pre-llenando datos desde configuración:', {
        nombre: params.preFilledName,
        email: params.preFilledEmail,
        apodoDJ: params.preFilledDJNickname || 'No proporcionado'
      });

      // Si viene un nombre completo, intentar separarlo
      const fullName = params.preFilledName as string;
      const nameParts = fullName.trim().split(' ');

      if (nameParts.length === 1) {
        setNombre(nameParts[0]);
        // 🔥 ARREGLO: Usar apodo pre-llenado si existe, sino usar nombre
        setApodoDJ((params.preFilledDJNickname as string) || nameParts[0]);
      } else {
        setNombre(nameParts[0]);
        setApellido(nameParts.slice(1).join(' '));
        // 🔥 ARREGLO: Usar apodo pre-llenado si existe, sino usar primer nombre
        setApodoDJ((params.preFilledDJNickname as string) || nameParts[0]);
      }

      // 🔥 CAMBIO: NO saltar al paso 2 automáticamente
      // Dejar que el usuario vea y confirme su apodo de DJ en el paso 1
      console.log('✅ Datos pre-llenados aplicados - Usuario puede verificar su apodo DJ');
    }
  }, [params.fromConfiguration, params.preFilledName, nombre]);

  // Opciones de especialidades predefinidas (🔥 ARREGLO: Max 10 chars c/u)
  const especialidadesOptions = [
    'House', 'Techno', 'Trance', 'D&B', 'Dubstep', // 'Drum & Bass' → 'D&B'
    'Reggaeton', 'Trap', 'Hip Hop', 'Pop', 'Rock',
    'Jazz Funk', 'Disco', 'Electro', 'Deep House', 'Prog' // 'Progressive' → 'Prog'
  ];

  const equipoOptions = ['Sí', 'No', 'Parcial']; // 🔥 ARREGLO: Máximo 10 caracteres

  const handleEquipoSelect = (option: string) => {
    setTieneEquipo(option);
    setShowEquipoDropdown(false);
  };

  const handleToggleEspecialidad = (especialidad: string) => {
    setSelectedEspecialidades(prev =>
      prev.includes(especialidad)
        ? prev.filter(e => e !== especialidad)
        : [...prev, especialidad]
    );
  };

  const handleSiguiente = () => {
    // Validar paso 1: nombre y apellido
    if (currentStep === 1) {
      if (!nombre.trim()) {
        Alert.alert('Error', 'Por favor ingresa tu nombre');
        return;
      }
      if (!apellido.trim()) {
        Alert.alert('Error', 'Por favor ingresa tu apellido');
        return;
      }
      setCurrentStep(2);
      return;
    }

    // Validar paso 2: especialidades
    if (currentStep === 2) {
      if (selectedEspecialidades.length === 0) {
        Alert.alert('Error', 'Por favor selecciona al menos una especialidad');
        return;
      }
      setCurrentStep(3);
      return;
    }

    // Guardar en paso 3
    if (currentStep === 3) {
      guardarRegistroDJ();
    }
  };

  const handleVolver = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const guardarRegistroDJ = async () => {
    setLoading(true);
    try {
      console.log('🎵 INICIO guardarRegistroDJ - Especialidades seleccionadas:', selectedEspecialidades);
      console.log('🎵 INICIO guardarRegistroDJ - tieneEquipo:', tieneEquipo);

      // Obtener el usuario actual
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Debes estar autenticado para registrarte como DJ');
        router.replace('/');
        return;
      }

      console.log('👤 Usuario obtenido:', user.id);

      // 🔥 NUEVO: Actualizar user_profiles con el nombre completo y apodo DJ
      const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`;
      const apodoFinal = apodoDJ.trim() || nombre.trim();

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: nombreCompleto,
          dj_nickname: apodoFinal, // 🔥 NUEVO: Guardar apodo en BD
          is_dj: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.warn('⚠️ Error actualizando nombre en user_profiles:', updateError);
        // No bloqueamos el flujo, solo advertimos
      } else {
        console.log('✅ Nombre y apodo DJ actualizados en user_profiles:', nombreCompleto, '/', apodoFinal);
      }

      // 🚀 OBJETO TEST ULTRA-MINIMAL PARA DIAGNOSTICAR
      const djProfileData = {
        user_id: user.id,
        generos: ['House'], // Solo un género corto para test
        tarifa_por_hora: 50000,
        is_activo: true
      };

      console.log('🔍 OBJETO MINIMAL PARA TEST:', djProfileData);
      console.log('🔍 user_id length:', user.id?.length || 'N/A');

      // Crear o actualizar SOLO el perfil DJ (sin tocar user_profiles)
      const djProfile = await supabaseFunctions.createOrUpdateDJProfile(
        user.id,
        djProfileData
      );

      if (!djProfile) {
        console.error('❌ Error creando/actualizando DJ profile');
        Alert.alert('Error', 'Hubo un problema al crear tu perfil DJ. Intenta de nuevo.');
        return;
      } else {
        console.log('✅ Perfil DJ creado exitosamente:', djProfile);
      }

      // 💾 Guardar nombre completo y apodo DJ en AsyncStorage
      await AsyncStorage.setItem('@mivok/current_user_name', nombreCompleto);
      console.log('💾 Nombre completo guardado en AsyncStorage:', nombreCompleto);

      // Guardar apodo DJ (ya calculado arriba como apodoFinal)
      await AsyncStorage.setItem('@mivok/dj_apodo', apodoFinal);
      console.log('💾 Apodo DJ guardado en AsyncStorage:', apodoFinal);

      // Guardar bandera local para no volver a pedir registro
      await AsyncStorage.setItem(DJ_FLAG_KEY, 'true');

      // ✅ Registro completo - navegar al Home DJ
      Alert.alert('🎉 ¡Éxito!', 'Te has registrado como DJ exitosamente', [
        { text: 'Continuar', onPress: () => router.replace('/home-dj') }
      ]);

    } catch (error) {
      console.error('❌ Error en registro:', error);
      Alert.alert('Error', 'Hubo un problema al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLink = (platform: string) => {
    // Implementar lógica de enlace de redes sociales
    Alert.alert('Próximamente', `Enlace con ${platform} próximamente`);
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
              <Text style={styles.title}>
                {currentStep === 1 ? 'Comenzemos con tu registro' :
                  currentStep === 2 ? '¿Cuál es tu especialidad?' :
                    '¿Posees tu propio equipo?'}
              </Text>
              <Text style={styles.subtitle}>
                Paso {currentStep} de 3
                <Text style={styles.emoji}>
                  {currentStep === 1 ? ' 🤝' :
                    currentStep === 2 ? ' 🎵' :
                      ' 🎧'}
                </Text>
              </Text>
            </View>

            {/* Formulario - PASO 1: Nombre y Apellido */}
            {(currentStep as number) === 1 && (
              <View style={styles.formContainer}>
                {/* Campo Nombre */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>¿Cuál es tu nombre? <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                  <TextInput
                    style={styles.textInput}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Tu nombre"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Campo Apellido */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>¿Cuál es tu apellido? <Text style={{ color: '#FF6B6B' }}>*</Text></Text>
                  <TextInput
                    style={styles.textInput}
                    value={apellido}
                    onChangeText={setApellido}
                    placeholder="Tu apellido"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Campo Apodo DJ */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Tu Apodo DJ</Text>
                  <TextInput
                    style={styles.textInput}
                    value={apodoDJ}
                    onChangeText={setApodoDJ}
                    placeholder="Opcional"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}

            {/* Formulario - PASO 2: Especialidades */}
            {(currentStep as number) === 2 && (
              <View style={styles.formContainer}>
                {/* Campo Especialidades - Multi-Select */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>¿Cuál es tu especialidad al mezclar?</Text>
                  <Text style={styles.fieldSubtitle}>Selecciona todas las que apliquen</Text>

                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowEspecialidadesDropdown(!showEspecialidadesDropdown)}
                  >
                    <View style={styles.selectedEspecialidadesView}>
                      {selectedEspecialidades.length > 0 ? (
                        <Text style={styles.dropdownText}>
                          {selectedEspecialidades.length} seleccionadas
                        </Text>
                      ) : (
                        <Text style={styles.dropdownText}>Selecciona tus géneros</Text>
                      )}
                    </View>
                    <Ionicons
                      name={showEspecialidadesDropdown ? "chevron-up" : "chevron-down"}
                      size={fp(20)}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showEspecialidadesDropdown && (
                    <ScrollView
                      style={styles.multiSelectOptions}
                      scrollEnabled={true}
                      nestedScrollEnabled={true}
                    >
                      {especialidadesOptions.map((especialidad, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.checkboxOption}
                          onPress={() => handleToggleEspecialidad(especialidad)}
                        >
                          <View style={[
                            styles.checkbox,
                            selectedEspecialidades.includes(especialidad) && styles.checkboxSelected
                          ]}>
                            {selectedEspecialidades.includes(especialidad) && (
                              <Ionicons name="checkmark" size={fp(12)} color="#fff" />
                            )}
                          </View>
                          <Text style={styles.checkboxLabel}>{especialidad}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {selectedEspecialidades.length > 0 && (
                    <View style={styles.selectedTagsContainer}>
                      {selectedEspecialidades.map((especialidad, index) => (
                        <View key={index} style={styles.selectedTag}>
                          <Text style={styles.selectedTagText}>{especialidad}</Text>
                          <TouchableOpacity onPress={() => handleToggleEspecialidad(especialidad)}>
                            <Ionicons name="close" size={fp(14)} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Formulario - PASO 3: Equipo y Redes Sociales */}
            {(currentStep as number) === 3 && (
              <View style={styles.formContainer}>
                {/* Campo Equipo */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>¿Posees tu equipo propio?</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowEquipoDropdown(!showEquipoDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {tieneEquipo || 'Selecciona una opción'}
                    </Text>
                    <Ionicons
                      name={showEquipoDropdown ? "chevron-up" : "chevron-down"}
                      size={fp(20)}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showEquipoDropdown && (
                    <View style={styles.dropdownOptions}>
                      {equipoOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownOption}
                          onPress={() => handleEquipoSelect(option)}
                        >
                          <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Enlaces de redes sociales */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Enlaza tus redes sociales</Text>
                  <View style={styles.socialContainer}>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLink('Facebook')}
                    >
                      <Ionicons name="logo-facebook" size={fp(18)} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLink('Instagram')}
                    >
                      <Ionicons name="logo-instagram" size={fp(18)} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLink('Twitter')}
                    >
                      <Ionicons name="logo-twitter" size={fp(18)} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.nextButton, loading && styles.buttonDisabled]}
                onPress={handleSiguiente}
                disabled={loading}
              >
                <Text style={styles.nextButtonText}>
                  {loading ? 'Procesando...' : (currentStep as number) === 3 ? 'Registrarse' : 'Siguiente'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleVolver}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>{(currentStep as number) === 1 ? 'Cancelar' : 'Atrás'}</Text>
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
  textAreaContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: wp(3),
    minHeight: hp(12),
    marginTop: hp(0.8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textArea: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: fp(15),
    color: "#333",
    textAlignVertical: "top",
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
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: wp(3),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: wp(80),
  },
  socialButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  selectedEspecialidadesView: {
    flex: 1,
  },
  multiSelectOptions: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: wp(2),
    marginTop: hp(0.3),
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.3)',
    zIndex: 1000,
    maxHeight: hp(25),
    width: '100%',
    maxWidth: wp(80),
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  checkbox: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(1),
    borderWidth: 1.5,
    borderColor: "#999",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(2.5),
  },
  checkboxSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkboxLabel: {
    fontSize: fp(13),
    color: "#333",
    flex: 1,
  },
  selectedTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(1.5),
    marginTop: hp(0.8),
    width: '100%',
    maxWidth: wp(80),
    justifyContent: 'center',
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
    backgroundColor: "#4CAF50",
    borderRadius: wp(2.5),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
  },
  selectedTagText: {
    fontSize: fp(11),
    color: "#fff",
    fontWeight: "600",
  },
});