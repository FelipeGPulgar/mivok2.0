import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import * as chatFunctions from '../lib/chat-functions';
import { formatCLP } from '../lib/formatters';
import { getAverageRatingForUser, listReviewsForUser } from '../lib/reviews-functions';
import { getCurrentUser } from '../lib/supabase';
import * as supabaseFunctions from '../lib/supabase-functions';

// Interfaz para los datos de DJ
interface DJ {
  id: string;
  nombre: string;
  ubicacion: string;
  calificacion: number;
  resenas: number;
  generos: string[];
  precio: number;
  imagen: string;
}

// Datos de ejemplo - en producción vendrían de Supabase
const DJS_MUESTRA: DJ[] = [
  {
    id: '1',
    nombre: 'DJ Alex Rivera',
    ubicacion: 'Buenos Aires, AR',
    calificacion: 4.8,
    resenas: 127,
    generos: ['Techno', 'House', 'EDM'],
    precio: 50000,
    imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    nombre: 'DJ Luna Martinez',
    ubicacion: 'Valparaíso, Valparaíso',
    calificacion: 4.9,
    resenas: 203,
    generos: ['Reggaeton', 'Trap', 'Indie'],
    precio: 60000,
    imagen: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    nombre: 'DJ Carlos Lopez',
    ubicacion: 'Concepción, Biobío',
    calificacion: 4.7,
    resenas: 89,
    generos: ['House', 'Deep House', 'Afro'],
    precio: 55000,
    imagen: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    nombre: 'DJ Sofia Fernandez',
    ubicacion: 'La Serena, Coquimbo',
    calificacion: 4.6,
    resenas: 156,
    generos: ['Techno', 'House', 'Minimal'],
    precio: 52000,
    imagen: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=300&fit=crop',
  },
];

export default function BuscarDJsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [selectedGeneros, setSelectedGeneros] = useState<string[]>([]);
  const [filteredDJs, setFilteredDJs] = useState<DJ[]>([]);
  const [allDJs, setAllDJs] = useState<DJ[]>([]);
  const [unreadBadges, setUnreadBadges] = useState<Map<string, number>>(new Map());
  const [currentUser, setCurrentUser] = useState<any>(null);

  const GENEROS_DISPONIBLES = [
    'Techno',
    'House',
    'EDM',
    'Reggaeton',
    'Trap',
    'Indie',
    'Deep House',
    'Afro',
    'Minimal',
    'Guaracha',
  ];

  // Cargar DJs desde Supabase y badges de mensajes no leídos
  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;

    const loadDJs = async () => {
      try {
        // Obtener usuario actual
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (!user) {
          console.log('ℹ️ Usuario no autenticado');
          return;
        }

        console.log('📥 Cargando DJs desde Supabase...');
        const djs = await supabaseFunctions.getAllActiveDJs();
        console.log('📊 DJs obtenidos:', djs);
        
        if (djs && djs.length > 0) {
          // Convertir DJProfile a DJ (para compatibilidad con UI)
          const convertedDJs: DJ[] = await Promise.all(djs.map(async (dj: any) => {
            // Obtener el nombre y foto del usuario desde user_profiles
            let djName = 'DJ';
            let djPhoto = dj.imagen_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop';
            
            try {
              const userProfile = await supabaseFunctions.getUserProfile(dj.user_id);
              if (userProfile?.first_name) {
                djName = userProfile.first_name;
              }
              // Usar la foto_url del usuario si existe
              if (userProfile?.foto_url) {
                djPhoto = userProfile.foto_url;
                console.log('📸 Foto cargada desde user_profiles para:', djName);
              }
            } catch (err) {
              console.warn('⚠️ No se pudo obtener perfil del usuario:', dj.user_id);
            }

            // Calcular calificación y número de reseñas reales
            const averageRating = await getAverageRatingForUser(dj.user_id);
            const reviews = await listReviewsForUser(dj.user_id);
            const reviewsCount = reviews.length;
            
            return {
              id: dj.user_id,
              nombre: djName,
              ubicacion: dj.ubicacion || 'Sin ubicación',
              calificacion: averageRating,
              resenas: reviewsCount,
              generos: dj.generos || [],
              precio: dj.tarifa_por_hora || 0,
              imagen: djPhoto,
            };
          }));
          setAllDJs(convertedDJs);
          setFilteredDJs(convertedDJs);
          console.log(`✅ Se cargaron ${convertedDJs.length} DJs`);

          // Cargar badges de no leídos para cada DJ
          console.log('📬 Cargando mensajes no leídos...');
          for (const dj of convertedDJs) {
            const unreadCount = await chatFunctions.getUnreadMessagesWithUser(user.id, dj.id);
            setUnreadBadges(prev => 
              new Map(prev).set(dj.id, unreadCount)
            );
          }
          console.log('✅ Badges cargados');
        } else {
          console.log('ℹ️ No hay DJs disponibles');
          setAllDJs(DJS_MUESTRA);
          setFilteredDJs(DJS_MUESTRA);
        }

        // SUSCRIBIRSE A TODOS LOS MENSAJES NUEVOS (TIEMPO REAL)
        console.log('🔔 Suscribiendo a mensajes en tiempo real...');
        unsubscribeMessages = chatFunctions.subscribeToAllMessages(
          user.id,
          (newMessage: any) => {
            console.log('📬 Nuevo mensaje de:', newMessage.sender_id);

            const senderId = newMessage.sender_id;

            // Si el mensaje es para nosotros
            if (newMessage.receiver_id === user.id) {
              // Actualizar badge del DJ que envió el mensaje
              setUnreadBadges(prev => {
                const newMap = new Map(prev);
                const current = newMap.get(senderId) || 0;
                newMap.set(senderId, current + 1);
                console.log(`🔴 Nuevo mensaje no leído de ${senderId}. Total: ${current + 1}`);
                return newMap;
              });
            }
          }
        );

        console.log('✅ Suscripción a tiempo real activa');
      } catch (error) {
        console.error('❌ Error al cargar DJs:', error);
        // Usar datos mock como fallback
        setAllDJs(DJS_MUESTRA);
        setFilteredDJs(DJS_MUESTRA);
      }
    };

    loadDJs();

    // Limpiar suscripción al desmontar
    return () => {
      if (unsubscribeMessages) {
        console.log('🔌 Desuscribiendo de mensajes...');
        unsubscribeMessages();
      }
    };
  }, []);

  // Función para aplicar todos los filtros
  const applyFilters = useCallback((text: string, generos: string[]) => {
    let filtered = allDJs;

    // Filtro de texto
    if (text.trim() !== '') {
      filtered = filtered.filter(
        (dj) =>
          dj.nombre.toLowerCase().includes(text.toLowerCase()) ||
          dj.ubicacion.toLowerCase().includes(text.toLowerCase())
      );
    }

    // Filtro de géneros
    if (generos.length > 0) {
      filtered = filtered.filter((dj) =>
        generos.some((genero) => dj.generos.includes(genero))
      );
    }

    setFilteredDJs(filtered);
  }, [allDJs]);

  // Función para filtrar DJs
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    applyFilters(text, selectedGeneros);
  }, [selectedGeneros, applyFilters]);

  // Función para alternar selección de géneros
  const toggleGenero = useCallback((genero: string) => {
    setSelectedGeneros((prev) => {
      const newGeneros = prev.includes(genero)
        ? prev.filter((g) => g !== genero)
        : [...prev, genero];
      applyFilters(searchText, newGeneros);
      return newGeneros;
    });
  }, [searchText, applyFilters]);

  // Función para limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchText('');
    applyFilters('', selectedGeneros);
  }, [selectedGeneros, applyFilters]);

  // Función para limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setSearchText('');
    setSelectedGeneros([]);
    setFilteredDJs(DJS_MUESTRA);
  }, []);

  // Componente de tarjeta de DJ
  const DJCard = ({ dj }: { dj: DJ }) => {
    const unreadCount = unreadBadges.get(dj.id) || 0;

    return (
      <TouchableOpacity 
        style={styles.djCard}
        onPress={() => router.push({
          pathname: '/perfil-dj',
          params: { djId: dj.id, djName: dj.nombre }
        })}
      >
        {/* Imagen de fondo */}
        <Image
          source={{ uri: dj.imagen }}
          style={styles.djImage}
        />
        
        {/* Overlay oscuro */}
        <View style={styles.overlay} />

        {/* Badge de mensajes no leídos */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadgeContainer}>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
            <Text style={styles.unreadLabel}>nuevos</Text>
          </View>
        )}

        {/* Contenedor de información */}
        <View style={styles.djInfo}>
          {/* Nombre */}
          <Text style={styles.djNombre}>{dj.nombre}</Text>

          {/* Ubicación */}
          <View style={styles.ubicacionRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <Path d="M12 18.5c-4 -1 -6 -2.5 -6 -6.5c0 -3.314 2.239 -6 6 -6s6 2.686 6 6c0 4 -2 5.5 -6 6.5" />
              <Path d="M12 13a1 1 0 1 0 0 -2a1 1 0 0 0 0 2" />
            </Svg>
            <Text style={styles.ubicacion}>{dj.ubicacion}</Text>
          </View>

          {/* Calificación y reseñas */}
          <View style={styles.ratingRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="#FFD700">
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </Svg>
            <Text style={styles.rating}>{dj.calificacion}</Text>
            <Text style={styles.resenas}>· {dj.resenas} reseñas</Text>
          </View>

          {/* Géneros */}
          <Text style={styles.generos}>
            {typeof dj.generos === 'string' ? dj.generos : dj.generos.join(' - ')}
          </Text>

          {/* Precio y botón */}
          <View style={styles.footerRow}>
            <Text style={styles.precio}>{formatCLP(dj.precio)}/hr</Text>
            <TouchableOpacity 
              style={styles.verPerfilBtn}
              onPress={() => router.push({
                pathname: '/perfil-dj',
                params: { djId: dj.id }
              })}
            >
              <Text style={styles.verPerfilText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con búsqueda */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar DJs</Text>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>💬</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar DJs..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de géneros */}
        <View style={styles.genresFilterContainer}>
          <Text style={styles.filterLabel}>Géneros:</Text>
          <FlatList
            horizontal
            data={GENEROS_DISPONIBLES}
            renderItem={({ item: genero }) => (
              <TouchableOpacity
                key={genero}
                style={[
                  styles.genreChip,
                  selectedGeneros.includes(genero) && styles.genreChipActive,
                ]}
                onPress={() => toggleGenero(genero)}
              >
                <Text
                  style={[
                    styles.genreChipText,
                    selectedGeneros.includes(genero) && styles.genreChipTextActive,
                  ]}
                >
                  {genero}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genresScrollContent}
          />
        </View>

        {/* Botón para limpiar filtros */}
        {(searchText !== '' || selectedGeneros.length > 0) && (
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}

        {/* Número de resultados */}
        <Text style={styles.resultsCount}>
          {filteredDJs.length} {filteredDJs.length === 1 ? 'resultado' : 'resultados'}
        </Text>
      </View>

      {/* Lista de DJs */}
      <FlatList
        data={filteredDJs}
        renderItem={({ item }) => <DJCard dj={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Mensaje cuando no hay resultados */}
      {filteredDJs.length === 0 && (
        <View style={styles.noResultsContainer}>
          <Svg width={60} height={60} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5}>
            <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <Path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            <Path d="M21 21l-6 -6" />
          </Svg>
          <Text style={styles.noResultsText}>No encontramos DJs que coincidan</Text>
          <Text style={styles.noResultsSubtext}>Intenta con otros términos de búsqueda</Text>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNavBar
        activeTab="inicio"
        onHomePress={() => router.push('/home-cliente')}
        onEventosPress={() => router.push('/apartadodj')}
        onSearchPress={() => {}}
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
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    color: '#fff',
    fontSize: 16,
  },
  resultsCount: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100, // Espacio para la barra de navegación
  },
  djCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    height: 280,
    backgroundColor: '#1a1a1a',
  },
  djImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  djInfo: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 20,
  },
  djNombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ubicacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ubicacion: {
    color: '#ddd',
    fontSize: 13,
    marginLeft: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  resenas: {
    color: '#999',
    fontSize: 13,
  },
  generos: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  verPerfilBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  verPerfilText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 14,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  genresFilterContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  genresScrollContent: {
    gap: 8,
    paddingRight: 20,
  },
  genreChip: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreChipActive: {
    backgroundColor: '#5B7EFF',
    borderColor: '#5B7EFF',
  },
  genreChipText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  genreChipTextActive: {
    color: '#fff',
  },
  clearFiltersBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  unreadBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  unreadBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  unreadLabel: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '500',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
});
