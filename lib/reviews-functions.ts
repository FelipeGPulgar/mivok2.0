// lib/reviews-functions.ts
// Funciones para manejar reseñas (reviews) alineadas con el esquema

import type { ReviewRow, UUID } from './db-types';
import { createSystemMessage } from './notification-functions';
import { supabase } from './supabase';

export type ReviewCreateInput = {
  event_id: UUID;
  reviewer_id: UUID;
  reviewee_id: UUID;
  calificacion: number; // 0..5
  resena?: string | null;
  aspectos?: any | null; // jsonb: { puntualidad: 4, audio: 5, ... }
};

export async function createReview(input: ReviewCreateInput): Promise<ReviewRow | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        event_id: input.event_id,
        reviewer_id: input.reviewer_id,
        reviewee_id: input.reviewee_id,
        calificacion: input.calificacion,
        resena: input.resena ?? null,
        aspectos: input.aspectos ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando reseña:', error);
      return null;
    }

    // Enviar alerta al reviewee
    const revieweeMessage = `Has recibido una nueva reseña con calificación ${input.calificacion}/5`;
    await createSystemMessage(input.reviewer_id, input.reviewee_id, revieweeMessage);

    return data as ReviewRow;
  } catch (e) {
    console.error('❌ Error en createReview:', e);
    return null;
  }
}

export async function listReviewsForUser(userId: UUID): Promise<ReviewRow[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error listando reseñas:', error);
      return [];
    }

    return (data || []) as ReviewRow[];
  } catch (e) {
    console.error('❌ Error en listReviewsForUser:', e);
    return [];
  }
}

export async function listReviewsForUserWithDetails(userId: UUID): Promise<any[]> {
  try {
    console.log('🔍 Buscando reseñas para userId:', userId);
    // Obtener reseñas básicas primero
    const reviews = await listReviewsForUser(userId);
    console.log('📋 Reseñas básicas encontradas:', reviews.length, reviews);

    // Para cada reseña, obtener información del reviewer
    const reviewsWithDetails = await Promise.all(
      reviews.map(async (review) => {
        try {
          console.log('👤 Buscando perfil del reviewer:', review.reviewer_id);
          const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, foto_url')
            .eq('user_id', review.reviewer_id)
            .single();

          if (error) {
            console.warn('⚠️ No se pudo obtener perfil del reviewer:', review.reviewer_id, error);
            return {
              ...review,
              reviewer_name: 'Usuario Anónimo',
              reviewer_photo: null,
            };
          }

          console.log('✅ Perfil encontrado:', userProfile);
          return {
            ...review,
            reviewer_name: userProfile?.first_name || 'Usuario Anónimo',
            reviewer_photo: userProfile?.foto_url || null,
          };
        } catch (err) {
          console.warn('⚠️ Error obteniendo perfil del reviewer:', review.reviewer_id, err);
          return {
            ...review,
            reviewer_name: 'Usuario Anónimo',
            reviewer_photo: null,
          };
        }
      })
    );

    console.log('🎉 Reseñas con detalles completadas:', reviewsWithDetails.length, reviewsWithDetails);
    return reviewsWithDetails;
  } catch (e) {
    console.error('❌ Error en listReviewsForUserWithDetails:', e);
    return [];
  }
}export async function getAverageRatingForUser(userId: UUID): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('calificacion');

    if (error) {
      console.error('❌ Error obteniendo calificaciones:', error);
      return 0;
    }

    const rows = (data || []).filter((r: any) => r.reviewee_id === userId);
    if (rows.length === 0) return 0;
    const avg = rows.reduce((acc: number, r: any) => acc + (r.calificacion || 0), 0) / rows.length;
    return Math.round(avg * 10) / 10; // una decimal
  } catch (e) {
    console.error('❌ Error en getAverageRatingForUser:', e);
    return 0;
  }
}
