// lib/supabase.ts - VERSIÓN CON MICROSOFT Y PERFILES DE USUARIO
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://bwaarivuswbaivrrcflv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWFyaXZ1c3diYWl2cnJjZmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDE4MjEsImV4cCI6MjA3MzExNzgyMX0.J3Rgg22KXCzuxXSYS3ONsdqgONdMhWUD9kwNU_Vgk14';

// Service key para operaciones administrativas (registro de email)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWFyaXZ1c3diYWl2cnJjZmx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU0MTgyMSwiZXhwIjoyMDczMTE3ODIxfQ.CttJZ4t0nF6SLnUOIJNJu8ow5FcRJMLzXckHTGO3_Js';

// Cliente Supabase para operaciones de servicio
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

WebBrowser.maybeCompleteAuthSession();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Don't provide AsyncStorage synchronously here — importing
    // '@react-native-async-storage/async-storage' at module load can
    // cause bundling/runtime issues (window undefined) in some
    // environments (Expo web / bundler). We intentionally avoid
    // automatic persistence and handle session restoration at runtime
    // if needed.
    detectSessionInUrl: false,
    persistSession: false,
    autoRefreshToken: true,
  },
});

// Tipo para el perfil de usuario
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
}

export const signInWithGoogle = async () => {
  try {
    console.log('🔄 Iniciando autenticación con Google... Plataforma:', Platform.OS);

    // URL de redirect mejorada para el nuevo scheme
    const redirectUrl = Platform.OS === 'web' 
      ? window.location.origin 
      : 'mivokapp://';
    
    console.log('🔗 Redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('❌ Error generando URL OAuth:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ URL OAuth generada');

    const authResult = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('📱 Resultado completo:', JSON.stringify(authResult, null, 2));
    console.log('📱 Tipo de resultado:', authResult.type);
    console.log('📱 URL de resultado:', authResult.type === 'success' ? authResult.url : 'N/A');

    if (authResult.type === 'success' && authResult.url) {
      console.log('🔗 URL de callback recibida:', authResult.url);

      // Manejo mejorado de la URL de callback
      const { queryParams } = Linking.parse(authResult.url);

      // Extraer tokens de diferentes formas posibles
      let accessToken = null;
      let refreshToken = null;
      let errorParam = null;

      // Método 1: De queryParams directamente
      if (queryParams) {
        accessToken = queryParams.access_token as string;
        refreshToken = queryParams.refresh_token as string;
        errorParam = queryParams.error as string;
      }

      // Método 2: De fragment si no se encontraron en query
      if (!accessToken) {
        const urlString = authResult.url;
        let paramString = '';

        if (urlString.includes('#')) {
          paramString = urlString.split('#')[1];
        } else if (urlString.includes('?')) {
          paramString = urlString.split('?')[1];
        }

        if (paramString) {
          const params = new URLSearchParams(paramString);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
          errorParam = params.get('error');
        }
      }

      console.log('🔑 Access Token:', accessToken ? '✅' : '❌');
      console.log('🔄 Refresh Token:', refreshToken ? '✅' : '❌');

      if (errorParam) {
        console.error('❌ Error en callback:', errorParam);
        return { success: false, error: errorParam };
      }

      if (accessToken && refreshToken) {
        console.log('💾 Estableciendo sesión...');

        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('❌ Error estableciendo sesión:', sessionError);
          return { success: false, error: sessionError.message };
        }

        // Crear o actualizar perfil de usuario
        if (sessionData.user) {
          await createOrUpdateUserProfile(sessionData.user, 'google');
        }

        console.log('✅ Login exitoso');
        return { success: true, user: sessionData.user };
      } else {
        console.error('❌ No se encontraron tokens en la respuesta');
        return { success: false, error: 'No se pudieron obtener los tokens de acceso' };
      }
    }

    if (authResult.type === 'cancel') {
      console.log('⏹️ Usuario canceló la autenticación');
      return { success: false, error: 'Autenticación cancelada' };
    }

    if (authResult.type === 'dismiss') {
      console.log('⏹️ Usuario cerró el navegador sin completar la autenticación');
      return { success: false, error: 'Autenticación cancelada por el usuario' };
    }

    console.error('❌ Tipo de resultado no reconocido:', authResult.type);
    return { success: false, error: 'No se pudo completar la autenticación' };

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error: error.message };
  }
};

// 🔥 NUEVA FUNCIÓN PARA MICROSOFT OAUTH
export const signInWithMicrosoft = async () => {
  try {
    console.log('🔄 Iniciando autenticación con Microsoft...');

    // URL de redirect mejorada para el nuevo scheme
    const redirectUrl = Platform.OS === 'web' 
      ? window.location.origin 
      : 'mivokapp://';
    
    console.log('🔗 Redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid',
      },
    });

    if (error) {
      console.error('❌ Error generando URL OAuth Microsoft:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ URL OAuth Microsoft generada');

    const authResult = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('📱 Resultado Microsoft:', authResult);

    if (authResult.type === 'success' && authResult.url) {
      console.log('🔗 URL de callback Microsoft recibida:', authResult.url);

      // Manejo mejorado de la URL de callback
      const { queryParams } = Linking.parse(authResult.url);

      // Extraer tokens de diferentes formas posibles
      let accessToken = null;
      let refreshToken = null;
      let errorParam = null;

      // Método 1: De queryParams directamente
      if (queryParams) {
        accessToken = queryParams.access_token as string;
        refreshToken = queryParams.refresh_token as string;
        errorParam = queryParams.error as string;
      }

      // Método 2: De fragment si no se encontraron en query
      if (!accessToken) {
        const urlString = authResult.url;
        let paramString = '';

        if (urlString.includes('#')) {
          paramString = urlString.split('#')[1];
        } else if (urlString.includes('?')) {
          paramString = urlString.split('?')[1];
        }

        if (paramString) {
          const params = new URLSearchParams(paramString);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
          errorParam = params.get('error');
        }
      }

      console.log('🔑 Microsoft Access Token:', accessToken ? '✅' : '❌');
      console.log('🔄 Microsoft Refresh Token:', refreshToken ? '✅' : '❌');

      if (errorParam) {
        console.error('❌ Error en callback Microsoft:', errorParam);
        return { success: false, error: errorParam };
      }

      if (accessToken && refreshToken) {
        console.log('💾 Estableciendo sesión Microsoft...');

        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('❌ Error estableciendo sesión Microsoft:', sessionError);
          return { success: false, error: sessionError.message };
        }

        // Crear o actualizar perfil de usuario
        if (sessionData.user) {
          await createOrUpdateUserProfile(sessionData.user, 'microsoft');
        }

        console.log('✅ Login Microsoft exitoso');
        return { success: true, user: sessionData.user };
      } else {
        console.error('❌ No se encontraron tokens Microsoft en la respuesta');
        return { success: false, error: 'No se pudieron obtener los tokens de Microsoft' };
      }
    }

    if (authResult.type === 'cancel') {
      console.log('⏹️ Usuario canceló la autenticación Microsoft');
      return { success: false, error: 'Autenticación Microsoft cancelada' };
    }

    if (authResult.type === 'dismiss') {
      console.log('⏹️ Usuario cerró el navegador sin completar la autenticación Microsoft');
      return { success: false, error: 'Autenticación Microsoft cancelada por el usuario' };
    }

    console.error('❌ Tipo de resultado Microsoft no reconocido:', authResult.type);
    return { success: false, error: 'No se pudo completar la autenticación Microsoft' };

  } catch (error: any) {
    console.error('❌ Error inesperado Microsoft:', error);
    return { success: false, error: error.message };
  }
};

// Función para crear o actualizar el perfil del usuario
const createOrUpdateUserProfile = async (user: any, provider: string) => {
  try {
    console.log('👤 Creando/actualizando perfil de usuario...');

    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error buscando perfil existente:', fetchError);
      return;
    }

    const profileData = {
      user_id: user.id,
      email: user.email,
      provider: provider,
      updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
      // Actualizar perfil existente
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error actualizando perfil:', updateError);
      } else {
        console.log('✅ Perfil actualizado');
      }
    } else {
      // Crear nuevo perfil
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creando perfil:', insertError);
      } else {
        console.log('✅ Perfil creado');
      }
    }
  } catch (error) {
    console.error('Error en createOrUpdateUserProfile:', error);
  }
};

// Función para obtener el perfil del usuario
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Supabase returns PGRST116 when the result contains 0 rows and .single() was used.
      // Treat that case as "no profile" (not an error) and return null silently.
      const errAny = error as any;
      const details = errAny?.details || '';
      const message = errAny?.message || '';

      if (
        errAny?.code === 'PGRST116' ||
        (typeof details === 'string' && details.includes('0 rows')) ||
        (typeof message === 'string' && message.includes('Cannot coerce the result'))
      ) {
        return null;
      }

      console.error('Error obteniendo perfil:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error en getUserProfile:', error);
    return null;
  }
};

// Función para actualizar nombre y apellido
export const updateUserNames = async (
  userId: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error actualizando nombres:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Nombres actualizados correctamente');
    return { success: true };
  } catch (error: any) {
    console.error('Error en updateUserNames:', error);
    return { success: false, error: error.message };
  }
};

// Safe helper to call supabase.auth.getUser() without throwing when
// the local session is missing (some environments / SDK versions
// throw an AuthSessionMissingError). Returns the original shape
// { data: { user }, error } or { data: { user: null }, error: null }
export const safeGetUser = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await supabase.auth.getUser();
    return res;
  } catch (e: any) {
    try { console.warn('⚠️ safeGetUser intercepted error from supabase.auth.getUser():', e?.message || e); } catch (_) { }
    return { data: { user: null }, error: null };
  }
};

export const getCurrentUser = async () => {
  try {
    // 1. Verificar sesión de Supabase (OAuth)
    const res = await safeGetUser();
    if (res?.data?.user) {
      return res.data.user;
    }
    
    // 2. Si no hay sesión OAuth, verificar usuario de email en AsyncStorage
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const userId = await AsyncStorage.getItem('@mivok/current_user_id');
    
    if (userId) {
      // Simular objeto user para compatibilidad
      const email = await AsyncStorage.getItem('@mivok/current_user_email');
      const name = await AsyncStorage.getItem('@mivok/current_user_name');
      const provider = await AsyncStorage.getItem('@mivok/current_user_provider');
      
      return {
        id: userId,
        email: email,
        user_metadata: {
          first_name: name,
          provider: provider
        }
      };
    }
    
    return null;
    
  } catch (error: any) {
    if (error?.name === 'AuthSessionMissingError' || error?.message?.includes('Auth session missing')) {
      // Expected when no session exists — return null silently
      return null;
    }
    console.error('Error obteniendo usuario:', error);
    return null;
  }
};

export const signOut = async () => {
  try {
    // Limpiar sesión de Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Limpiar también información de email user en AsyncStorage
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.multiRemove([
      '@mivok/current_user_id',
      '@mivok/current_user_email', 
      '@mivok/current_user_name',
      '@mivok/current_user_provider'
    ]);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const hasActiveSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return false;
  }
};

// 🔍 FUNCIÓN PARA VERIFICAR SI UN EMAIL YA EXISTE Y CON QUÉ PROVIDER
export const checkEmailProvider = async (email: string) => {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('provider, email')
      .eq('email', email.trim().toLowerCase())
      .limit(1);
    
    if (error) {
      console.error('❌ Error verificando email:', error.message);
      return { exists: false, provider: null, error: error.message };
    }
    
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      return { 
        exists: true, 
        provider: profile.provider,
        error: null 
      };
    }
    
    return { exists: false, provider: null, error: null };
    
  } catch (error: any) {
    console.error('❌ Error inesperado verificando email:', error);
    return { exists: false, provider: null, error: error.message };
  }
};

// 🗑️ FUNCIÓN PARA ELIMINAR CUENTA EXISTENTE
export const deleteUserAccount = async (email: string) => {
  try {
    console.log('🗑️ Eliminando cuenta para email:', email);
    
    // Eliminar de la tabla user_profiles que contiene los perfiles de usuario
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', email.trim().toLowerCase());
    
    if (profileError) {
      console.error('❌ Error eliminando perfil:', profileError);
      return { success: false, error: profileError.message };
    }
    
    console.log('✅ Cuenta eliminada exitosamente');
    return { success: true, error: null };
    
  } catch (error: any) {
    console.error('❌ Error inesperado eliminando cuenta:', error);
    return { success: false, error: error.message };
  }
};

// 📧 FUNCIÓN PARA CREAR USUARIO CON EMAIL (usando admin client)
export const createEmailUser = async (email: string, password: string, firstName: string) => {
  try {
    console.log('👤 Creando usuario con email usando admin client:', email);
    
    // Crear usuario en auth.users usando admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        provider: 'email',
        first_name: firstName
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario auth:', authError);
      return { success: false, error: authError.message, user: null };
    }

    if (!authData.user) {
      return { success: false, error: 'No se pudo crear el usuario', user: null };
    }

    console.log('✅ Usuario auth creado:', authData.user.id);

    // Crear perfil en user_profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email: email.trim().toLowerCase(),
        provider: 'email',
        first_name: firstName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_dj: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creando perfil:', profileError);
      // Si falla el perfil, eliminar el usuario auth creado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: profileError.message, user: null };
    }

    console.log('✅ Perfil creado exitosamente');
    return { 
      success: true, 
      error: null, 
      user: authData.user,
      profile: profileData 
    };

  } catch (error: any) {
    console.error('❌ Error inesperado creando usuario email:', error);
    return { success: false, error: error.message, user: null };
  }
};