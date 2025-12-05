// lib/user-mode-functions.ts
// Funciones para manejar el modo actual del usuario (cliente/dj)

import { supabase } from './supabase';

export type UserMode = 'cliente' | 'dj';

export interface UserModeRecord {
  id: string;
  user_id: string;
  current_mode: UserMode;
  updated_at: string;
  created_at: string;
}

// Obtener el modo actual del usuario
export const getCurrentUserMode = async (): Promise<UserMode | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return null;
    }

    const { data, error } = await supabase
      .from('user_current_mode')
      .select('current_mode')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error obteniendo modo usuario:', error);
      return null;
    }

    console.log('🎭 Modo actual del usuario:', data?.current_mode || 'no configurado');
    return data?.current_mode || null;
  } catch (error) {
    console.error('❌ Error en getCurrentUserMode:', error);
    return null;
  }
};

// Establecer el modo actual del usuario
export const setCurrentUserMode = async (mode: UserMode): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return false;
    }

    console.log('🎭 Estableciendo modo usuario:', mode);

    // Usar upsert para crear o actualizar
    const { error } = await supabase
      .from('user_current_mode')
      .upsert({
        user_id: user.id,
        current_mode: mode
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Error estableciendo modo usuario:', error);
      return false;
    }

    console.log('✅ Modo usuario establecido:', mode);
    return true;
  } catch (error) {
    console.error('❌ Error en setCurrentUserMode:', error);
    return false;
  }
};

// Verificar si el usuario puede actuar como DJ
export const canActAsDJ = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Verificar si tiene perfil DJ
    const { data, error } = await supabase
      .from('dj_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    return !error && data !== null;
  } catch (error) {
    console.error('❌ Error verificando capacidad DJ:', error);
    return false;
  }
};

// Verificar si el usuario puede actuar como cliente
export const canActAsClient = async (): Promise<boolean> => {
  // Todos los usuarios pueden ser clientes
  const { data: { user } } = await supabase.auth.getUser();
  return user !== null;
};