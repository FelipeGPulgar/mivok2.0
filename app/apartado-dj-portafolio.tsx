import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import { formatCLP } from '../lib/formatters';
import { getCurrentUser } from '../lib/supabase';
import * as supabaseFunctions from '../lib/supabase-functions';

interface DJProfile {
  id: string;
  nombre: string;
  ubicacion: string;
  calificacion: number;
  resenas: number;
  eventos: number;
  anosExperiencia: number;
  generos: string[];
  descripcion: string;
  precio: number;
  imagen: string;
  cuentaConEquipamiento?: string;
  equipamiento?: string[];
}

export default function ApartadoDJPortafolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dj, setDj] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cuentaConEquipamiento, setCuentaConEquipamiento] = useState<string>('No');
  const [equipamiento, setEquipamiento] = useState<string[]>([]);

  // Cargar perfil del DJ actual (logueado)
  useEffect(() => {
    const loadCurrentDJProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          Alert.alert('Error', 'No se pudo obtener el usuario');
          return;
        }

        const djFullProfile = await supabaseFunctions.getDJWithDetails(user.id);
        
        if (djFullProfile) {
          const convertedDJ: DJProfile = {
            id: djFullProfile.user_id,
            nombre: djFullProfile.nombre || 'DJ Profesional',
            ubicacion: djFullProfile.ubicacion || 'Sin ubicación',
            calificacion: djFullProfile.calificacion || 0,
            resenas: djFullProfile.resenas_count || 0,
            eventos: djFullProfile.eventos_realizados || 0,
            anosExperiencia: djFullProfile.anos_en_app || 0,
            generos: djFullProfile.generos || [],
            descripcion: djFullProfile.descripcion_largo || 'Sin descripción disponible',
            precio: djFullProfile.tarifa_por_hora || 0,
            imagen: djFullProfile.imagen_url || djFullProfile.foto_perfil || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
            cuentaConEquipamiento: djFullProfile.cuenta_con_equipamiento,
            equipamiento: djFullProfile.equipamiento,
          };
          setDj(convertedDJ);
          
          // 🎛️ Cargar equipamiento del DJ
          if (djFullProfile.cuenta_con_equipamiento) {
            setCuentaConEquipamiento(djFullProfile.cuenta_con_equipamiento);
          }
          if (djFullProfile.equipamiento && Array.isArray(djFullProfile.equipamiento)) {
            setEquipamiento(djFullProfile.equipamiento);
          }
        } else {
          Alert.alert('Error', 'No se encontró el perfil del DJ');
        }
      } catch (error) {
        console.error('Error al cargar perfil DJ:', error);
        Alert.alert('Error', 'Ocurrió un error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    loadCurrentDJProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!dj) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5B7EFF" strokeWidth={2}>
            <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <Path d="M15 6l-6 6l6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vista Previa</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Foto de perfil */}
        <View style={styles.photoSection}>
          <Image
            source={{ uri: dj.imagen }}
            style={styles.profileImage}
          />
        </View>

        {/* Información básica */}
        <View style={styles.basicInfo}>
          <Text style={styles.djName}>{dj.nombre}</Text>
          <Text style={styles.djLocation}>📍 {dj.ubicacion}</Text>

          {/* Estadísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dj.eventos}</Text>
              <Text style={styles.statLabel}>Eventos</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dj.anosExperiencia}+</Text>
              <Text style={styles.statLabel}>Años</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dj.generos.length}</Text>
              <Text style={styles.statLabel}>Géneros</Text>
            </View>
          </View>
        </View>

        {/* Tarifa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Tarifa por hora</Text>
          <Text style={styles.tarifaText}>{formatCLP(dj.precio)}</Text>
          <Text style={styles.tarifaNote}>El precio final puede variar según la duración y tipo de evento</Text>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Sobre mí</Text>
          <Text style={styles.description}>{dj.descripcion}</Text>
        </View>

        {/* Géneros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Géneros musicales</Text>
          <View style={styles.genreList}>
            {dj.generos.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Equipamiento */}
        {equipamiento && equipamiento.length > 0 && (
          <View style={styles.section}>
            <View style={styles.equipamientoHeader}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#5B7EFF" strokeWidth={2}>
                <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <Path d="M4 7l16 0" />
                <Path d="M5 20h14a2 2 0 0 0 2 -2v-10a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2" />
                <Path d="M9 9v2" />
                <Path d="M15 9v2" />
                <Path d="M9 16v2" />
                <Path d="M15 16v2" />
              </Svg>
              <Text style={styles.equipamientoTitle}>🎛️ Equipamiento</Text>
            </View>
            <Text style={styles.equipamientoSubtitle}>Equipamiento disponible</Text>
            <View style={styles.equipamientoList}>
              {equipamiento.map((item, index) => (
                <View key={index} style={styles.equipamientoTag}>
                  <Text style={styles.equipamientoText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botón Editar Perfil - Fixed at bottom */}
      <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 80 }]}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/editar-perfil')}
        >
          <Text style={styles.editBtnText}>✏️ Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  photoSection: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  basicInfo: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#0a0a0a',
  },
  djName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  djLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B7EFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#333',
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tarifaText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5B7EFF',
    marginBottom: 8,
  },
  tarifaNote: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  genreText: {
    color: '#ccc',
    fontSize: 12,
  },
  equipamientoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  equipamientoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  equipamientoSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  equipamientoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipamientoTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5B7EFF',
  },
  equipamientoText: {
    color: '#5B7EFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  editBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
