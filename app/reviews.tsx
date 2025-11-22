import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import type { ReviewRow } from '../lib/db-types';
import { createReview, listReviewsForUser } from '../lib/reviews-functions';
import { getCurrentUser } from '../lib/supabase';

interface ReviewFormData {
  eventId: string;
  revieweeId: string;
  revieweeName: string;
  calificacion: number;
  resena: string;
}

export default function ResenasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData>({
    eventId: '',
    revieweeId: '',
    revieweeName: '',
    calificacion: 5,
    resena: '',
  });
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);

  // Cargar reseñas del usuario actual
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      setCurrentUser(user);
      const userReviews = await listReviewsForUser(user.id);
      setReviews(userReviews || []);
    } catch (error) {
      console.error('❌ Error cargando reseñas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Si vienen parámetros para crear reseña
  useEffect(() => {
    const eventId = params.eventId as string;
    const revieweeId = params.revieweeId as string;
    const revieweeName = params.revieweeName as string;

    if (eventId && revieweeId && revieweeName) {
      setFormData({
        eventId,
        revieweeId,
        revieweeName,
        calificacion: 5,
        resena: '',
      });
      setShowForm(true);
    }
  }, [params.eventId, params.revieweeId, params.revieweeName]);

  const handleSubmitReview = async () => {
    if (formData.calificacion === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación.');
      return;
    }

    if (!formData.resena.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario.');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const reviewData = {
        event_id: formData.eventId,
        reviewer_id: user.id,
        reviewee_id: formData.revieweeId,
        calificacion: formData.calificacion,
        resena: formData.resena.trim(),
      };

      const newReview = await createReview(reviewData);
      if (newReview) {
        Alert.alert('¡Éxito!', 'Tu reseña ha sido enviada correctamente.');
        setShowForm(false);
        setFormData({
          eventId: '',
          revieweeId: '',
          revieweeName: '',
          calificacion: 5,
          resena: '',
        });
        // Recargar reseñas
        await loadReviews();
      } else {
        Alert.alert('Error', 'No se pudo enviar la reseña. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error enviando reseña:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar la reseña. Verifica tu conexión.');
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    const displayRating = interactive ? (hoverRating !== undefined ? hoverRating : rating) : rating;

    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => onRate && onRate(star)}
            onPressIn={() => interactive && setHoverRating(star)}
            onPressOut={() => interactive && setHoverRating(undefined)}
            style={styles.starButton}
          >
            <Text style={[
              styles.star,
              star <= displayRating && styles.starFilled,
              interactive && styles.starInteractive
            ]}>
              {star <= displayRating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: ReviewRow }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatarSmall}>
          <Text style={{ color: '#111', fontWeight: '900' }}>👤</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewTitle}>Reseña recibida</Text>
          <Text style={styles.reviewDate}>
            {new Date(item.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{item.calificacion}/5</Text>
          {renderStars(item.calificacion)}
        </View>
      </View>
      {item.resena && (
        <View style={styles.reviewContent}>
          <Text style={styles.reviewText}>{item.resena}</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>⭐</Text>
      </View>
      <Text style={styles.emptyTitle}>Aún no tienes reseñas</Text>
      <Text style={styles.emptySubtitle}>
        Las reseñas que recibas de tus clientes aparecerán aquí.
        ¡Mantén un excelente servicio para obtener buenas calificaciones!
      </Text>
    </View>
  );

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.calificacion, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  if (showForm) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowForm(false)}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Dejar Reseña</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Califica tu experiencia</Text>
            <Text style={styles.formSubtitle}>con {formData.revieweeName}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.label}>¿Qué calificación le das?</Text>
            <View style={styles.ratingContainer}>
              {renderStars(formData.calificacion, true, (rating) =>
                setFormData(prev => ({ ...prev, calificacion: rating }))
              )}
              <Text style={styles.ratingValue}>{formData.calificacion} de 5 estrellas</Text>
            </View>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.label}>Cuéntanos tu experiencia</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Comparte los detalles de tu experiencia..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              value={formData.resena}
              onChangeText={(text) => setFormData(prev => ({ ...prev, resena: text }))}
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {formData.resena.length}/500 caracteres
            </Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview}>
            <Text style={styles.submitBtnText}>Enviar Reseña ⭐</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Reseñas</Text>
        <View style={{ width: 40 }} />
      </View>

      {reviews.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getAverageRating()}</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {reviews.filter(r => r.calificacion >= 4).length}
            </Text>
            <Text style={styles.statLabel}>Excelentes</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando reseñas...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavBar
        activeTab={currentUser?.user_metadata?.user_type === 'dj' ? 'apartadomasdj' : 'apartadomascliente'}
        onHomePress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj'
            ? '/home-dj'
            : '/home-cliente';
          router.push(route);
        }}
        onEventosPress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj'
            ? '/eventos-dj'
            : '/eventos-cliente';
          router.push(route as any);
        }}
        onSearchPress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj'
            ? '/chats-dj'
            : '/chats-cliente';
          router.push(route as any);
        }}
        onAlertasPress={() => {
          const route = currentUser?.user_metadata?.user_type === 'dj'
            ? '/alertas-dj'
            : '/alertas-cliente';
          router.push(route as any);
        }}
        onMasPress={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#5B7EFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  reviewCard: {
    backgroundColor: '#191919',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#999',
    fontSize: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 20,
    color: '#666',
  },
  starFilled: {
    color: '#FFD700',
  },
  starInteractive: {
    fontSize: 24,
  },
  reviewText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  ratingBadge: {
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reviewContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  emptyIcon: {
    fontSize: 32,
    color: '#FFD700',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    color: '#5B7EFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingSection: {
    marginBottom: 32,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  ratingValue: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  commentSection: {
    marginBottom: 32,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    color: '#fff',
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#191919',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
  },
  submitBtn: {
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});