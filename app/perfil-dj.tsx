import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import { formatCLP } from '../lib/formatters';
import * as profileFunctions from '../lib/profile-functions';
import { getAverageRatingForUser, listReviewsForUserWithDetails } from '../lib/reviews-functions';
import * as supabaseFunctions from '../lib/supabase-functions';

// Interfaz para datos del DJ
interface DJDetail {
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
}

// Datos de ejemplo - en producción vendrían de Supabase
const DJS_DATA: { [key: string]: DJDetail } = {
  '1': {
    id: '1',
    nombre: 'DJ Alex Rivera',
    ubicacion: 'Santiago, Metropolitana',
    calificacion: 4.8,
    resenas: 127,
    eventos: 45,
    anosExperiencia: 5,
    generos: ['Techno', 'House', 'EDM'],
    descripcion:
      'DJ profesional con más de 5 años de experiencia en eventos corporativos, bodas y fiestas privadas. Especializado en crear ambientes únicos que conectan con cada tipo de audiencia.',
    precio: 50000,
    imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
  },
  '2': {
    id: '2',
    nombre: 'DJ Luna Martinez',
    ubicacion: 'Valparaíso, Valparaíso',
    calificacion: 4.9,
    resenas: 203,
    eventos: 62,
    anosExperiencia: 7,
    generos: ['Reggaeton', 'Trap', 'Indie'],
    descripcion:
      'DJ con amplia experiencia en eventos masivos y fiestas privadas. Mi especialidad es crear conexiones emocionales a través de la música, adaptándome a cada público.',
    precio: 60000,
    imagen: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop',
  },
  '3': {
    id: '3',
    nombre: 'DJ Carlos Lopez',
    ubicacion: 'Concepción, Biobío',
    calificacion: 4.7,
    resenas: 89,
    eventos: 38,
    anosExperiencia: 4,
    generos: ['House', 'Deep House', 'Afro'],
    descripcion:
      'DJ especialista en música house y deep house. Con 4 años en la industria, he tocado en los mejores clubs de Concepción. Disponible para eventos corporativos y privados.',
    precio: 55000,
    imagen: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=600&h=400&fit=crop',
  },
  '4': {
    id: '4',
    nombre: 'DJ Sofia Fernandez',
    ubicacion: 'La Serena, Coquimbo',
    calificacion: 4.6,
    resenas: 156,
    eventos: 51,
    anosExperiencia: 6,
    generos: ['Techno', 'House', 'Minimal'],
    descripcion:
      'DJ versátil con experiencia en diferentes géneros musicales. Passion por la música electrónica y dedicada a crear experiencias memorables en cada evento.',
    precio: 52000,
    imagen: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=400&fit=crop',
  },
};

export default function PerfilDJScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const djId = params.djId as string;
  const [dj, setDj] = useState<DJDetail | null>(null);
  const [loading, setLoading] = useState(true);
  // 🔥 Estados para galería
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // 🎛️ Estados para equipamiento
  const [cuentaConEquipamiento, setCuentaConEquipamiento] = useState<string>('No');
  const [equipamiento, setEquipamiento] = useState<string[]>([]);
  // ⭐ Estados para reseñas
  const [reviews, setReviews] = useState<any[]>([]);

  // Cargar perfil del DJ desde Supabase
  useEffect(() => {
    const loadDJProfile = async () => {
      try {
        // Intentar cargar desde Supabase primero
        const djFullProfile = await supabaseFunctions.getDJWithDetails(djId);
        
        if (djFullProfile) {
          // Calcular calificación y reseñas reales
          const averageRating = await getAverageRatingForUser(djFullProfile.user_id);
          const djReviews = await listReviewsForUserWithDetails(djFullProfile.user_id);
          console.log('📝 Reseñas cargadas para DJ:', djFullProfile.user_id, 'Cantidad:', djReviews.length, djReviews);
          setReviews(djReviews);
          const convertedDJ: DJDetail = {
            id: djFullProfile.user_id,
            nombre: djFullProfile.nombre || 'DJ Profesional',
            ubicacion: djFullProfile.ubicacion || 'Sin ubicación',
            calificacion: averageRating,
            resenas: djReviews.length,
            eventos: djFullProfile.eventos_realizados || 0,
            anosExperiencia: djFullProfile.anos_en_app || 0,
            generos: djFullProfile.generos || [],
            descripcion: djFullProfile.descripcion_largo || 'Sin descripción disponible',
            precio: djFullProfile.tarifa_por_hora || 0,
            imagen: djFullProfile.imagen_url || djFullProfile.foto_perfil || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
          };
          setDj(convertedDJ);
          
          // 🎛️ Cargar equipamiento del DJ
          if (djFullProfile.cuenta_con_equipamiento) {
            setCuentaConEquipamiento(djFullProfile.cuenta_con_equipamiento);
          }
          if (djFullProfile.equipamiento && Array.isArray(djFullProfile.equipamiento)) {
            setEquipamiento(djFullProfile.equipamiento);
          }
          
          // 🔥 Cargar galería de fotos del DJ
          const gallery = await profileFunctions.getDJGalleryImages(djFullProfile.user_id);
          if (gallery && gallery.length > 0) {
            setGalleryImages(gallery);
          }
        } else {
          // Fallback a datos mock si no existe en Supabase
          const mockDJ = DJS_DATA[djId];
          setDj(mockDJ || null);
        }
      } catch (error) {
        console.error('Error al cargar perfil DJ:', error);
        // Fallback a datos mock
        const mockDJ = DJS_DATA[djId];
        setDj(mockDJ || null);
      } finally {
        setLoading(false);
      }
    };

    loadDJProfile();
  }, [djId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cargando perfil...</Text>
        </View>
      </View>
    );
  }

  if (!dj) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>DJ no encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con botón atrás */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
            <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <Path d="M15 6l-6 6l6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Galería de fotos / Imagen principal */}
        <View style={styles.imageContainer}>
          {galleryImages.length > 0 ? (
            // Mostrar galería deslizable si hay fotos
            <View style={styles.galleryContainer}>
              <Image
                source={{ uri: galleryImages[currentImageIndex]?.image_url || dj.imagen }}
                style={styles.coverImage}
              />
              <View style={styles.imageOverlay} />
              
              {/* Indicadores de página */}
              <View style={styles.dotsContainer}>
                {galleryImages.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dot,
                      currentImageIndex === index && styles.dotActive
                    ]}
                    onPress={() => setCurrentImageIndex(index)}
                  />
                ))}
              </View>
              
              {/* Botones de navegación */}
              {galleryImages.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.arrowLeft]}
                    onPress={() => setCurrentImageIndex(prev => 
                      prev === 0 ? galleryImages.length - 1 : prev - 1
                    )}
                  >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                      <Path d="M15 6l-6 6l6 6" />
                    </Svg>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.arrowRight]}
                    onPress={() => setCurrentImageIndex(prev => 
                      prev === galleryImages.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                      <Path d="M9 6l6 6l-6 6" />
                    </Svg>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            // Mostrar imagen principal si no hay galería
            <>
              <Image
                source={{ uri: dj.imagen }}
                style={styles.coverImage}
              />
              <View style={styles.imageOverlay} />
            </>
          )}
        </View>

        {/* Información principal */}
        <View style={styles.mainInfo}>
          <Text style={styles.djName}>{dj.nombre}</Text>

          {/* Ubicación */}
          <View style={styles.locationRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth={2}>
              <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <Path d="M12 18.5c-4 -1 -6 -2.5 -6 -6.5c0 -3.314 2.239 -6 6 -6s6 2.686 6 6c0 4 -2 5.5 -6 6.5" />
              <Path d="M12 13a1 1 0 1 0 0 -2a1 1 0 0 0 0 2" />
            </Svg>
            <Text style={styles.location}>{dj.ubicacion}</Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="#FFD700">
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </Svg>
            <Text style={styles.rating}>{dj.calificacion}</Text>
            <Text style={styles.resenas}>· {dj.resenas} reseñas</Text>
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{dj.eventos}</Text>
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{dj.anosExperiencia}+</Text>
            <Text style={styles.statLabel}>Años exp.</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{dj.generos.length}</Text>
            <Text style={styles.statLabel}>Géneros</Text>
          </View>
        </View>

        {/* Sección "Sobre mí" */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre mí</Text>
          <Text style={styles.description}>{dj.descripcion}</Text>
        </View>

        {/* Géneros musicales */}
        <View style={styles.section}>
          <View style={styles.genreHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <Path d="M9 5a4 4 0 1 0 0 8a4 4 0 0 0 0 -8" />
              <Path d="M5 19h14a2 2 0 0 0 2 -2v-5a9 9 0 0 0 -18 0v5a2 2 0 0 0 2 2" />
            </Svg>
            <Text style={styles.genreTitle}>Géneros musicales</Text>
          </View>
          <View style={styles.genreList}>
            {dj.generos.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 🎛️ Equipamiento */}
        {equipamiento && equipamiento.length > 0 && (
          <View style={styles.section}>
            <View style={styles.equipamientoHeader}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
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

        {/* ⭐ Reseñas */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </Svg>
              <Text style={styles.reviewsTitle}>Reseñas ({reviews.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewsScroll}>
              {reviews.slice(0, 5).map((review, index) => (
                <View key={review.id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Image
                        source={{ uri: review.reviewer_photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' }}
                        style={styles.reviewerAvatar}
                      />
                      <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {[...Array(5)].map((_, starIndex) => (
                        <Svg
                          key={starIndex}
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill={starIndex < review.calificacion ? "#FFD700" : "#333"}
                        >
                          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </Svg>
                      ))}
                      <Text style={styles.reviewRating}>{review.calificacion}/5</Text>
                    </View>
                  </View>
                  {review.resena && (
                    <Text style={styles.reviewText} numberOfLines={4}>
                      "{review.resena}"
                    </Text>
                  )}
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              ))}
            </ScrollView>
            {reviews.length > 5 && (
              <Text style={styles.moreReviewsText}>
                +{reviews.length - 5} reseñas más...
              </Text>
            )}
          </View>
        )}

        {/* Tarifa */}
        <View style={styles.section}>
          <View style={styles.tarifaHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <Path d="M12 1a12 12 0 1 0 0 24a12 12 0 0 0 0 -24" />
              <Path d="M16.5 7.5c0 2.5 -2 4 -4.5 4s-4.5 -1.5 -4.5 -4m0 10h8m-4 -5v5" />
            </Svg>
            <Text style={styles.tarifaTitle}>Tarifa</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCLP(dj.precio)}</Text>
            <Text style={styles.priceUnit}>/hora</Text>
          </View>
          <Text style={styles.priceNote}>
            El precio final puede variar según la duración y tipo de evento
          </Text>
        </View>

        {/* Espacio para no overlayear con la barra */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.proposalButton}
          onPress={() => router.push({
            pathname: '/chat',
            params: { djId: dj.id, djName: dj.nombre }
          })}
        >
          <Text style={styles.proposalButtonText}>Hacer propuesta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => router.push({
            pathname: '/chat',
            params: { djId: dj.id, djName: dj.nombre }
          })}
        >
          <Text style={styles.messageButtonText}>Enviar mensaje</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavBar
        activeTab="inicio"
        onHomePress={() => router.push('/home-cliente')}
        onEventosPress={() => router.push('/apartadodj')}
        onSearchPress={() => router.push('/buscar-djs')}
        onAlertasPress={() => router.push('/alertas')}
        onMasPress={() => router.push('/apartadomascliente')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
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
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#5B7EFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 280,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mainInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  djName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  location: {
    color: '#999',
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  resenas: {
    color: '#666',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#5B7EFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#222',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    color: '#bbb',
    lineHeight: 24,
  },
  genreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  genreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreTag: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  genreText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  // 🎛️ Estilos para equipamiento
  equipamientoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  equipamientoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  equipamientoSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  equipamientoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  equipamientoTag: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#5B7EFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  equipamientoText: {
    color: '#5B7EFF',
    fontSize: 12,
    fontWeight: '500',
  },
  tarifaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  tarifaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#5B7EFF',
  },
  priceUnit: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  priceNote: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 0,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 8,
    backgroundColor: '#111',
    gap: 8,
    marginBottom: 0,
    flexDirection: 'row',
  },
  proposalButton: {
    flex: 1,
    backgroundColor: '#5B7EFF',
    paddingVertical: 12,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B7EFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  proposalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: '#333',
    paddingVertical: 12,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // 🔥 Estilos para galería
  galleryContainer: {
    position: 'relative',
    width: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
    zIndex: 10,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  // ⭐ Estilos para reseñas
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  reviewsScroll: {
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 300,
    borderWidth: 1,
    borderColor: '#333',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRating: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
  },
  moreReviewsText: {
    color: '#5B7EFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
