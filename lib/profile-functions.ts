// lib/profile-functions.ts
// Funciones para manejar perfiles de usuario

import { safeGetUser, supabase } from './supabase';

// ============================================================================
// INTERFACES
// ============================================================================

export interface UserProfile {
  user_id: string;
  first_name: string;
  email: string;
  is_dj: boolean;
  foto_url?: string;
  descripcion?: string;
  telefono?: string;
  ciudad?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// OBTENER PERFIL
// ============================================================================

/**
 * Obtener perfil completo del usuario actual
 */
export const getCurrentProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user }, error: authError } = await safeGetUser();

    if (authError || !user) {
      console.error('❌ Error obteniendo usuario autenticado:', authError);
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();  // ✅ CAMBIADO: Usar maybeSingle para evitar error si no existe

    if (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('❌ Error en getCurrentProfile:', error);
    return null;
  }
};

/**
 * Obtener perfil de cualquier usuario por ID
 */
export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('❌ Error en getUserProfileById:', error);
    return null;
  }
};

// ============================================================================
// ACTUALIZAR PERFIL
// ============================================================================

/**
 * Actualizar datos básicos del perfil
 */
export const updateProfile = async (
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const { data: { user }, error: authError } = await safeGetUser();

    if (authError || !user) {
      console.error('❌ Error obteniendo usuario autenticado:', authError);
      return null;
    }

    console.log('🔄 Actualizando perfil para user_id:', user.id);

    // Intentar actualizar primero
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Error en UPDATE, intentando UPSERT:', error.message);
      
      // Si falla, intentar con upsert
      const { data: upsertData, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          ignoreDuplicates: false,  // ✅ Hacer update si existe
        })
        .select()
        .single();

      if (upsertError) {
        try { console.error('❌ Error en UPSERT (detalles):', JSON.stringify(upsertError)); } catch(e) { console.error('❌ Error en UPSERT (no serializable):', upsertError); }
        return null;
      }

      console.log('✅ Perfil actualizado con upsert');
      return upsertData;
    }

    console.log('✅ Perfil actualizado');
    return data;
  } catch (error) {
    console.error('❌ Error en updateProfile:', error);
    return null;
  }
};

// ============================================================================
// FOTO DE PERFIL - STORAGE
// ============================================================================

/**
 * Obtener URL pública de foto de perfil desde Storage
 */
export const getProfileImageUrl = (userId: string, fileName: string = 'profile'): string => {
  try {
    const { data } = supabase.storage
      .from('profile_images')
      .getPublicUrl(`${userId}/${fileName}`);

    return data?.publicUrl || '';
  } catch (error) {
    console.error('❌ Error obteniendo URL de imagen:', error);
    return '';
  }
};

/**
 * Subir foto de perfil a Storage
 */
export const uploadProfileImage = async (
  userId: string,
  base64Data: string,
  fileName: string = 'profile'
): Promise<string | null> => {
  try {
    console.log('📤 Iniciando carga de imagen...');
    
    // Generar un nombre de archivo único para evitar caché
    const timestamp = Date.now();
    const uniqueFileName = `${fileName}_${timestamp}.jpg`;
    const filePath = `${userId}/${uniqueFileName}`;
    
    // Convertir base64 a Uint8Array para Supabase
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    console.log('📤 Subiendo archivo a Supabase Storage...');
    
    // Subir usando el Uint8Array directamente
    const { error } = await supabase.storage
      .from('profile_images')
      .upload(filePath, byteArray, {
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error);
      return null;
    }

    // Obtener URL pública del path único
    const { data } = supabase.storage
      .from('profile_images')
      .getPublicUrl(filePath);

    const publicUrl = data?.publicUrl || '';
    console.log('✅ Imagen subida correctamente:', publicUrl);

    // Intentar limpiar imágenes antiguas en segundo plano (best-effort)
    cleanupOldProfileImages(userId, `${userId}/${uniqueFileName}`)
      .then(() => console.log('🧹 Limpieza de imágenes antiguas completada'))
      .catch((e) => console.warn('⚠️ Limpieza de imágenes antiguas falló:', e));

    return publicUrl;
  } catch (error) {
    console.error('❌ Error en uploadProfileImage:', error);
    return null;
  }
};

/**
 * Elimina fotos antiguas de perfil del usuario, conservando la más reciente
 */
export const cleanupOldProfileImages = async (userId: string, keepFullPath?: string) => {
  try {
    const { data: files, error } = await supabase.storage
      .from('profile_images')
      .list(userId, { limit: 100 });

    if (error) {
      console.warn('⚠️ No se pudo listar imágenes de perfil:', error);
      return;
    }

    if (!files || files.length === 0) return;

    // Quedarse con archivos tipo profile_*.jpg y excluir el actual
    const candidates = files
      .filter(f => /^profile_\d+\.jpg$/i.test(f.name))
      .map(f => ({
        path: `${userId}/${f.name}`,
        name: f.name,
        updated_at: (f as any).updated_at || (f as any).created_at || '',
      }))
      .filter(f => (keepFullPath ? f.path !== keepFullPath : true));

    if (candidates.length === 0) return;

    // Mantener la más reciente por timestamp en el nombre o por updated_at
    const parseTs = (name: string) => {
      const m = name.match(/^profile_(\d+)\.jpg$/i);
      return m ? Number(m[1]) : 0;
    };
    candidates.sort((a, b) => parseTs(b.name) - parseTs(a.name));

    // Eliminar todas excepto la primera
    const toDelete = candidates.slice(1).map(f => f.path);
    if (toDelete.length === 0) return;

    const { error: delError } = await supabase.storage
      .from('profile_images')
      .remove(toDelete);

    if (delError) {
      console.warn('⚠️ Error eliminando imágenes antiguas:', delError);
      return;
    }

    console.log(`🧹 Eliminadas ${toDelete.length} imágenes antiguas de perfil`);
  } catch (e) {
    console.warn('⚠️ cleanupOldProfileImages exception:', e);
  }
};

/**
 * Actualizar URL de foto en perfil
 */
export const updateProfileImageUrl = async (imageUrl: string): Promise<boolean> => {
  try {
    const { data: { user }, error: authError } = await safeGetUser();

    if (authError || !user) {
      console.error('❌ Error obteniendo usuario autenticado:', authError);
      return false;
    }

    console.log('🔄 Actualizando foto_url en Supabase para user_id:', user.id);

    // Primero, intentar actualizar
    const { data: updateResult, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        foto_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select();

    if (updateError) {
      // Loguear todo el objeto de error para debugging (RLS, detalles, hint)
      try { console.error('⚠️ Error en UPDATE (detalles):', JSON.stringify(updateError)); } catch(e) { console.error('⚠️ Error en UPDATE (no serializable):', updateError); }
      
      // Si falla, intentar con upsert (insert o update)
      // 🔥 NOTA: En Supabase JS client, upsert() espera el array de columnas de conflicto
      console.log('🔄 Intentando UPSERT con columna de conflicto: user_id');
      const { data: upsertData, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          foto_url: imageUrl,
          updated_at: new Date().toISOString(),
        }, {
          ignoreDuplicates: false,  // ✅ Hacer update si existe
        });

      if (upsertError) {
        try { console.error('❌ Error en UPSERT (detalles):', JSON.stringify(upsertError)); } catch(e) { console.error('❌ Error en UPSERT (no serializable):', upsertError); }
        
        // Si UPSERT también falla, intentar INSERT directo
        console.log('⚠️ UPSERT falló, intentando INSERT directo...');
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            foto_url: imageUrl,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          try { console.error('❌ Error en INSERT (detalles):', JSON.stringify(insertError)); } catch(e) { console.error('❌ Error en INSERT (no serializable):', insertError); }
          return false;
        }
        console.log('✅ Foto insertada correctamente con INSERT');
        return true;
      }
      console.log('✅ Foto actualizada con upsert');
      return true;
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('ℹ️ Update retornó 0 filas, intentando insert...');
      
      // Si no se actualizó nada, intentar insertar
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          foto_url: imageUrl,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        try { console.error('❌ Error insertando foto_url (detalles):', JSON.stringify(insertError)); } catch(e) { console.error('❌ Error insertando foto_url (no serializable):', insertError); }
        return false;
      }
      console.log('✅ Foto insertada correctamente');
      return true;
    }

    console.log('✅ URL de foto actualizada en perfil');
    return true;
  } catch (error) {
    console.error('❌ Error en updateProfileImageUrl:', error);
    return false;
  }
};

// ============================================================================
// DJ - PROFILE
// ============================================================================

/**
 * Obtener perfil DJ del usuario actual
 */
export const getCurrentDJProfile = async () => {
  try {
    const { data: { user }, error: authError } = await safeGetUser();

    if (authError || !user) {
      console.error('❌ Error obteniendo usuario autenticado:', authError);
      return null;
    }

    const { data, error } = await supabase
      .from('dj_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error obteniendo perfil DJ:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('❌ Error en getCurrentDJProfile:', error);
    return null;
  }
};

/**
 * Actualizar perfil DJ
 */
export const updateDJProfile = async (updates: any): Promise<boolean> => {
  try {
    const { data: { user }, error: authError } = await safeGetUser();

    if (authError || !user) {
      console.error('❌ Error obteniendo usuario autenticado:', authError);
      return false;
    }

    const { error } = await supabase
      .from('dj_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error actualizando perfil DJ:', error);
      return false;
    }

    console.log('✅ Perfil DJ actualizado');
    return true;
  } catch (error) {
    console.error('❌ Error en updateDJProfile:', error);
    return false;
  }
};

// ============================================================================
// GALERÍA DE DJ - FOTOS ADICIONALES
// ============================================================================

/**
 * Obtener todas las fotos de galería de un DJ
 */
export const getDJGalleryImages = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('dj_gallery_images')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo galería:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getDJGalleryImages:', error);
    return [];
  }
};

/**
 * Subir foto a la galería del DJ
 */
export const uploadDJGalleryImage = async (
  userId: string,
  base64Data: string,
  fileName: string = 'gallery'
): Promise<string | null> => {
  try {
    console.log('📤 Iniciando carga de foto de galería...');
    
    const filePath = `${userId}/gallery/${Date.now()}_${fileName}`;
    
    // Convertir base64 a Uint8Array
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    console.log('📤 Subiendo archivo a Supabase Storage...');
    
    const { error } = await supabase.storage
      .from('dj_gallery')
      .upload(filePath, byteArray, {
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('❌ Error subiendo imagen de galería:', error);
      return null;
    }

    // Obtener URL pública
    const { data } = supabase.storage
      .from('dj_gallery')
      .getPublicUrl(filePath);

    console.log('✅ Foto de galería subida:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('❌ Error en uploadDJGalleryImage:', error);
    return null;
  }
};

/**
 * Agregar foto a la galería del DJ
 */
export const addDJGalleryImage = async (
  userId: string,
  imageUrl: string,
  order: number = 0
): Promise<boolean> => {
  try {
    console.log('🔄 Agregando foto a galería...');

    const { error } = await supabase
      .from('dj_gallery_images')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        order: order,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Error agregando imagen a galería:', error);
      return false;
    }

    console.log('✅ Foto agregada a la galería');
    return true;
  } catch (error) {
    console.error('❌ Error en addDJGalleryImage:', error);
    return false;
  }
};

/**
 * Eliminar foto de la galería del DJ
 */
export const removeDJGalleryImage = async (imageId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando foto de galería...');

    const { error } = await supabase
      .from('dj_gallery_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('❌ Error eliminando imagen de galería:', error);
      return false;
    }

    console.log('✅ Foto eliminada de la galería');
    return true;
  } catch (error) {
    console.error('❌ Error en removeDJGalleryImage:', error);
    return false;
  }
};

/**
 * Reordenar fotos de galería
 */
export const reorderDJGalleryImages = async (
  updates: Array<{ id: string; order: number }>
): Promise<boolean> => {
  try {
    console.log('🔄 Reordenando galería...');

    for (const update of updates) {
      const { error } = await supabase
        .from('dj_gallery_images')
        .update({ order: update.order })
        .eq('id', update.id);

      if (error) {
        console.error('❌ Error reordenando imagen:', error);
        return false;
      }
    }

    console.log('✅ Galería reordenada');
    return true;
  } catch (error) {
    console.error('❌ Error en reorderDJGalleryImages:', error);
    return false;
  }
};

