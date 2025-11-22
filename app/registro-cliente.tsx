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
  const CLIENT_FLAG_KEY = '@mivok/is_client_registered';
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [selectedGeneros, setSelectedGeneros] = useState<string[]>([]);
  const [showGenerosDropdown, setShowGenerosDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Géneros musicales disponibles (mismos que DJs)
  const musicGeneros = [
    'House',
    'Techno',
    'Trance',
    'Drum & Bass',
    'Dubstep',
    'Reggaeton',
    'Trap',
    'Hip Hop',
    'Pop',
    'Rock',
    'Jazz Funk',
    'Disco',
    'Electro',
    'Deep House',
    'Progressive'
  ];

  const handleSiguiente = () => {
    // Validar nombre y apellido
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }
    if (!apellido.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu apellido');
      return;
    }
    if (!telefono.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu teléfono');
      return;
    }
    guardarRegistroCliente();
  };

  const handleToggleGenero = (genero: string) => {
    setSelectedGeneros(prev => 
      prev.includes(genero) 
        ? prev.filter(g => g !== genero)
        : [...prev, genero]
    );
  };

  const handleVolver = () => {
    router.back();
  };

  const guardarRegistroCliente = async () => {
    setLoading(true);
    try {
      // Guardar datos del cliente localmente
      const clientData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        generosPreferidos: selectedGeneros,
        timestamp: new Date().toISOString(),
      };

      console.log('💾 Guardando datos del cliente localmente:', clientData);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(CLIENT_FLAG_KEY, 'true');
      await AsyncStorage.setItem('@mivok/client_data', JSON.stringify(clientData));

      // Navegar directo al Home Cliente sin mostrar diálogo para evitar pantallas intermedias
      router.replace('/home-cliente');
    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert('Error', 'Hubo un problema al registrar. Intenta de nuevo.');
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
                />
              </View>

              {/* Campo Teléfono */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Tu teléfono <Text style={{color: '#FF6B6B'}}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="Tu número de teléfono"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Campo Géneros Preferidos */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Géneros que te gustan</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowGenerosDropdown(!showGenerosDropdown)}
                >
                  <View style={styles.selectedEspecialidadesView}>
                    {selectedGeneros.length > 0 ? (
                      <Text style={styles.dropdownText}>
                        {selectedGeneros.length} género{selectedGeneros.length > 1 ? 's' : ''} seleccionado{selectedGeneros.length > 1 ? 's' : ''}
                      </Text>
                    ) : (
                      <Text style={styles.dropdownText}>Selecciona géneros (opcional)</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {showGenerosDropdown && (
                  <ScrollView style={styles.dropdownOptions} nestedScrollEnabled={true}>
                    {musicGeneros.map((genero, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.multiSelectOption}
                        onPress={() => handleToggleGenero(genero)}
                      >
                        <View style={[
                          styles.checkbox,
                          selectedGeneros.includes(genero) && styles.checkboxSelected
                        ]}>
                          {selectedGeneros.includes(genero) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.multiSelectText}>{genero}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Tags de géneros seleccionados */}
              {selectedGeneros.length > 0 && (
                <View style={styles.tagsContainer}>
                  {selectedGeneros.map((genero, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{genero}</Text>
                      <TouchableOpacity onPress={() => handleToggleGenero(genero)}>
                        <Text style={styles.tagClose}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>



            {/* Botones de acción */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.nextButton, loading && styles.buttonDisabled]} 
                onPress={handleSiguiente}
                disabled={loading}
              >
                <Text style={styles.nextButtonText}>
                  {loading ? 'Registrando...' : 'Registrarse'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleVolver}
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

