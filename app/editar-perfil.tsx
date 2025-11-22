import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import * as profileFunctions from '../lib/profile-functions';
import { getCurrentDJProfile } from '../lib/profile-functions';
import { getCurrentUser } from '../lib/supabase';

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

// 🎛️ Equipamiento disponible
const EQUIPAMIENTO_DISPONIBLE = [
    'Luces LED',
    'Máquina de humo',
    'Parlante',
    'Micrófono',
    'Mixer',
    'Controladora DJ',
    'Monitor de estudio',
    'Iluminación laser',
    'Efectos especiales',
];

// Opciones para "Cuenta con equipamiento"
const OPCIONES_EQUIPAMIENTO = ['Sí', 'No'];

export default function EditarPerfilScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const DJ_FLAG_KEY = '@mivok/is_dj_registered';
    const PROFILE_IMAGE_KEY = '@mivok/profile_image';

    // Estado general
    const [isDJ, setIsDJ] = useState<boolean | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Estado para Cliente
    const [clientNombre, setClientNombre] = useState('');
    const [clientEmail, setClientEmail] = useState('');

    // Estado para DJ
    const [djNombre, setDjNombre] = useState('');
    const [djDescripcion, setDjDescripcion] = useState('');
    const [djTarifa, setDjTarifa] = useState('');
    const [djUbicacion, setDjUbicacion] = useState('');
    const [selectedGeneros, setSelectedGeneros] = useState<string[]>([]);
    const [customGeneros, setCustomGeneros] = useState<string[]>([]);
    const [nuevoGenero, setNuevoGenero] = useState<string>('');
    // 🎛️ Estados para equipamiento
    const [cuentaConEquipamiento, setCuentaConEquipamiento] = useState<string>('No');
    const [selectedEquipamiento, setSelectedEquipamiento] = useState<string[]>([]);
    // 🔥 Estados para galería de DJ
    const [galleryImages, setGalleryImages] = useState<Array<{ id?: string; url: string; isNew?: boolean }>>([]);

    // Detectar si es DJ o Cliente y cargar datos
    const loadUserProfile = useCallback(async () => {
        try {
            // Primero, intentar usar el parámetro type
            let isUserDJ = params.type === 'dj';
            
            // Si no hay parámetro, verificar la flag en AsyncStorage
            if (!params.type) {
                const isDJRegistered = await AsyncStorage.getItem(DJ_FLAG_KEY);
                isUserDJ = isDJRegistered === 'true';
            }
            
            setIsDJ(isUserDJ);

            // 🔥 CARGAR FOTO DEL USUARIO DESDE SUPABASE (por usuario específico)
            const user = await getCurrentUser();
            if (user) {
                console.log('📸 Cargando foto de perfil para usuario:', user.id);
                const profileData = await profileFunctions.getCurrentProfile();
                if (profileData?.foto_url) {
                    console.log('✅ Foto cargada desde Supabase:', profileData.foto_url);
                    setProfileImage(profileData.foto_url);
                } else {
                    // Foto por defecto si no tiene
                    console.log('ℹ️ Sin foto de perfil, usando default');
                    setProfileImage('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop');
                }
            }

            // Cargar datos del usuario desde Supabase (user_profiles)
            const user2 = await getCurrentUser();
            if (user2) {
                // 🔥 CARGAR DATOS DE user_profiles EN LUGAR DE user_metadata
                const userProfile = await profileFunctions.getCurrentProfile();
                const displayName = userProfile?.first_name || user2.user_metadata?.full_name || 'Usuario';
                const email = userProfile?.email || user2.email || '';

                if (isUserDJ) {
                    // Cargar datos de DJ (de Supabase)
                    // Cargar perfil DJ existente si hay
                    const djProfile = await getCurrentDJProfile();
                    if (djProfile) {
                        setDjNombre(displayName);
                        setDjDescripcion(djProfile.descripcion_largo || 'Agregá una descripción sobre ti...');
                        setDjTarifa(djProfile.tarifa_por_hora ? String(djProfile.tarifa_por_hora) : '');
                        setDjUbicacion(djProfile.ubicacion || '');
                        const generosExistentes: string[] = Array.isArray(djProfile.generos) ? djProfile.generos : [];
                        setSelectedGeneros(generosExistentes);
                        setCustomGeneros(generosExistentes.filter(g => !GENEROS_DISPONIBLES.includes(g)));
                        setCuentaConEquipamiento(djProfile.cuenta_con_equipamiento || 'No');
                        setSelectedEquipamiento(Array.isArray(djProfile.equipamiento) ? djProfile.equipamiento : []);
                    } else {
                        // Valores por defecto si no existe perfil
                        setDjNombre(displayName);
                        setDjDescripcion('Agregá una descripción sobre ti...');
                        setDjTarifa('');
                        setDjUbicacion('');
                        setSelectedGeneros([]);
                        setCustomGeneros([]);
                        setCuentaConEquipamiento('No');
                        setSelectedEquipamiento([]);
                    }
                    // Galería
                    const galleryPhotos = await profileFunctions.getDJGalleryImages(user2.id);
                    if (galleryPhotos && galleryPhotos.length > 0) {
                        setGalleryImages(galleryPhotos.map(photo => ({ id: photo.id, url: photo.image_url, isNew: false })));
                    }
                } else {
                    // Cargar datos de Cliente
                    setClientNombre(displayName);
                    setClientEmail(email);
                }
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        }
    }, [params.type]);

    useEffect(() => {
        loadUserProfile();
    }, [loadUserProfile]);

    // Seleccionar imagen
    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permiso denegado', 'Se requiere permiso para acceder a la galería');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                setProfileImage(imageUri);
                // 🔥 NO guardamos en AsyncStorage - se guardará en Supabase al presionar "Guardar"
            }
        } catch (error) {
            console.error('Error al seleccionar imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    // Toggle género
    const toggleGenero = (genero: string) => {
        setSelectedGeneros((prev) =>
            prev.includes(genero) ? prev.filter((g) => g !== genero) : [...prev, genero]
        );
        if (!GENEROS_DISPONIBLES.includes(genero)) {
            // Es un género personalizado
            setCustomGeneros(prev => prev.includes(genero) ? prev.filter(g => g !== genero) : [...prev, genero]);
        }
    };

    const agregarGeneroPersonalizado = () => {
        const limpio = nuevoGenero.trim();
        if (!limpio) return;
        if (limpio.length > 30) {
            Alert.alert('Error', 'El género no puede superar 30 caracteres');
            return;
        }
        if (selectedGeneros.includes(limpio)) {
            Alert.alert('Atención', 'Ese género ya está seleccionado');
            return;
        }
        setSelectedGeneros(prev => [...prev, limpio]);
        setCustomGeneros(prev => [...prev, limpio]);
        setNuevoGenero('');
    };

    const eliminarGeneroPersonalizado = (genero: string) => {
        setSelectedGeneros(prev => prev.filter(g => g !== genero));
        setCustomGeneros(prev => prev.filter(g => g !== genero));
    };

    // 🎛️ Toggle equipamiento
    const toggleEquipamiento = (equipo: string) => {
        setSelectedEquipamiento((prev) =>
            prev.includes(equipo) ? prev.filter((e) => e !== equipo) : [...prev, equipo]
        );
    };

    // 🔥 Agregar fotos a la galería del DJ
    const handleAddGalleryImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permiso denegado', 'Se requiere permiso para acceder a la galería');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                // Agregar la nueva imagen a la lista (será subida al guardar)
                setGalleryImages([
                    ...galleryImages,
                    {
                        url: imageUri,
                        isNew: true
                    }
                ]);
            }
        } catch (error) {
            console.error('Error al seleccionar imagen para galería:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    // 🔥 Eliminar foto de la galería
    const handleRemoveGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    // Guardar perfil de Cliente
    const saveClientProfile = async () => {
        if (!clientNombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setIsSaving(true);
        try {
            const user = await getCurrentUser();
            if (!user) {
                Alert.alert('Error', 'No se pudo obtener el usuario');
                setIsSaving(false);
                return;
            }

            console.log('📝 Guardando perfil de cliente...');

            // Si hay nueva imagen, subirla primero
            // 🔥 Detectar si es una foto nueva (URI local o data:)
            if (profileImage && !profileImage.includes('unsplash.com') && !profileImage.includes('supabase.co')) {
                try {
                    console.log('📸 Subiendo imagen de perfil...');
                    
                    let base64Data = profileImage;
                    
                    // Si es URI local (file://), convertir a base64
                    if (profileImage.startsWith('file://')) {
                        console.log('🔄 Convirtiendo archivo local a base64...');
                        const response = await fetch(profileImage);
                        const buffer = await response.arrayBuffer();
                        
                        // Convertir ArrayBuffer a base64
                        const bytes = new Uint8Array(buffer);
                        let binary = '';
                        for (let i = 0; i < bytes.byteLength; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        base64Data = btoa(binary);
                    } else if (profileImage.startsWith('data:')) {
                        // Ya es data URL, extraer base64
                        base64Data = profileImage.split(',')[1] || profileImage;
                    }
                    
                    // Extraer base64 puro (sin prefijo data:)
                    const base64Pure = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
                    console.log('✅ Base64 listo, tamaño:', base64Pure.length, 'caracteres');
                    
                    const imageUrl = await profileFunctions.uploadProfileImage(user.id, base64Pure);
                    if (imageUrl) {
                        console.log('✅ Imagen subida:', imageUrl);
                        await profileFunctions.updateProfileImageUrl(imageUrl);
                        setProfileImage(imageUrl); // 🔥 Actualizar el estado con la URL de Supabase
                    }
                } catch (imageError) {
                    console.error('⚠️ Error al subir imagen:', imageError);
                    Alert.alert('Error con la imagen', `No se pudo subir la imagen: ${imageError}`);
                    // Continuar aunque falle la imagen
                }
            }

            // Guardar datos del perfil en Supabase
            const success = await profileFunctions.updateProfile({
                first_name: clientNombre,
                email: clientEmail,
                is_dj: false,
            });

            if (success) {
                // Guardar en AsyncStorage también (para cache local)
                await AsyncStorage.setItem('@mivok/is_dj_registered', 'false');
                
                console.log('✅ Perfil de cliente guardado');
                Alert.alert('Éxito', 'Perfil actualizado correctamente', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', 'No se pudo guardar el perfil');
            }
        } catch (error) {
            console.error('❌ Error al guardar perfil:', error);
            Alert.alert('Error', 'Ocurrió un error al guardar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    // Guardar perfil de DJ
    const saveDJProfile = async () => {
        if (!djNombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }
        if (!djDescripcion.trim()) {
            Alert.alert('Error', 'La descripción es obligatoria');
            return;
        }
        if (!djTarifa.trim()) {
            Alert.alert('Error', 'La tarifa es obligatoria');
            return;
        }
        if (!djUbicacion.trim()) {
            Alert.alert('Error', 'La ubicación es obligatoria');
            return;
        }
        if (selectedGeneros.length === 0) {
            Alert.alert('Error', 'Debes seleccionar al menos un género');
            return;
        }

        setIsSaving(true);
        try {
            const user = await getCurrentUser();
            if (!user) {
                Alert.alert('Error', 'No se pudo obtener el usuario');
                setIsSaving(false);
                return;
            }

            console.log('📝 Guardando perfil de DJ...');

            // Si hay nueva imagen, subirla primero
            // 🔥 Detectar si es una foto nueva (URI local o data:)
            if (profileImage && !profileImage.includes('unsplash.com') && !profileImage.includes('supabase.co')) {
                try {
                    console.log('📸 Subiendo imagen de perfil DJ...');
                    
                    // Si es URI local, convertir a base64
                    let base64Data = profileImage;
                    if (profileImage.startsWith('file://')) {
                        // URI local - convertir a base64
                        const response = await fetch(profileImage);
                        const blob = await response.blob();
                        base64Data = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    }
                    
                    // Extraer base64 puro
                    const base64Pure = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
                    const imageUrl = await profileFunctions.uploadProfileImage(user.id, base64Pure);
                    if (imageUrl) {
                        console.log('✅ Imagen subida:', imageUrl);
                        await profileFunctions.updateProfileImageUrl(imageUrl);
                        setProfileImage(imageUrl); // 🔥 Actualizar el estado con la URL de Supabase
                    }
                } catch (imageError) {
                    console.error('⚠️ Error al subir imagen (continuando...):', imageError);
                    // Continuar aunque falle la imagen
                }
            }

            // Actualizar perfil de usuario
            const profileUpdateResult = await profileFunctions.updateProfile({
                first_name: djNombre,
                is_dj: true,
            });

            if (!profileUpdateResult) {
                Alert.alert('Error', 'No se pudo actualizar el perfil de usuario');
                setIsSaving(false);
                return;
            }

            // Guardar perfil DJ en Supabase usando las nuevas funciones
            const djProfileResult = await profileFunctions.updateDJProfile({
                tarifa_por_hora: parseInt(djTarifa, 10),
                generos: selectedGeneros,
                descripcion_largo: djDescripcion,
                ubicacion: djUbicacion,
                // 🎛️ Agregar equipamiento
                cuenta_con_equipamiento: cuentaConEquipamiento,
                equipamiento: selectedEquipamiento,
                is_activo: true,
            });

            if (!djProfileResult) {
                Alert.alert('Error', 'No se pudo guardar el perfil DJ');
                setIsSaving(false);
                return;
            }

            if (djProfileResult) {
                // Guardar en AsyncStorage también (para cache local)
                await AsyncStorage.setItem('@mivok/is_dj_registered', 'true');
                
                // 🔥 Guardar fotos de la galería
                for (let i = 0; i < galleryImages.length; i++) {
                    const photo = galleryImages[i];
                    
                    // Solo procesar fotos nuevas (que vienen como URIs locales)
                    if (photo.isNew && photo.url.startsWith('file://')) {
                        try {
                            console.log(`📸 Subiendo foto de galería ${i + 1}...`);
                            
                            // Convertir a base64
                            const response = await fetch(photo.url);
                            const blob = await response.blob();
                            const base64Data = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.readAsDataURL(blob);
                            });
                            
                            const base64Pure = base64Data.split(',')[1] || base64Data;
                            const galleryUrl = await profileFunctions.uploadDJGalleryImage(user.id, base64Pure, `gallery_${i}`);
                            
                            if (galleryUrl) {
                                console.log(`✅ Foto de galería ${i + 1} subida`);
                                await profileFunctions.addDJGalleryImage(user.id, galleryUrl, i);
                            }
                        } catch (galleryError) {
                            console.error(`⚠️ Error al subir foto de galería ${i + 1}:`, galleryError);
                            // Continuar con las siguientes fotos
                        }
                    }
                }
                
                console.log('✅ Perfil de DJ guardado');
                Alert.alert('Éxito', 'Perfil actualizado correctamente', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (error) {
            console.error('❌ Error al guardar perfil DJ:', error);
            Alert.alert('Error', 'Ocurrió un error al guardar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        if (isDJ) {
            saveDJProfile();
        } else {
            saveClientProfile();
        }
    };

    if (isDJ === null) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.loadingText}>Cargando...</Text>
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
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Foto de perfil */}
                <View style={styles.photoSection}>
                    <TouchableOpacity style={styles.photoContainer} onPress={handlePickImage}>
                        <Image
                            source={{ uri: profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop' }}
                            style={styles.profileImage}
                        />
                        <View style={styles.changePhotoOverlay}>
                            <Ionicons name="camera" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.photoHint}>Toca para cambiar foto</Text>
                </View>

                {isDJ ? (
                    /* DJ PROFILE FORM */
                    <>
                        {/* Nombre */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu nombre como DJ"
                                placeholderTextColor="#666"
                                value={djNombre}
                                onChangeText={setDjNombre}
                                maxLength={50}
                            />
                            <Text style={styles.characterCount}>{djNombre.length}/50</Text>
                        </View>

                        {/* Descripción */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Descripción</Text>
                            <TextInput
                                style={[styles.input, styles.textAreaInput]}
                                placeholder="Cuéntale a tus clientes sobre ti y tu experiencia como DJ..."
                                placeholderTextColor="#666"
                                value={djDescripcion}
                                onChangeText={setDjDescripcion}
                                multiline
                                maxLength={500}
                            />
                            <Text style={styles.characterCount}>{djDescripcion.length}/500</Text>
                        </View>

                        {/* Tarifa por hora */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tarifa por hora (CLP)</Text>
                            <View style={styles.tarifaInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.tarifaInput}
                                    placeholder="50000"
                                    placeholderTextColor="#666"
                                    value={djTarifa}
                                    onChangeText={(text) => setDjTarifa(text.replace(/[^0-9]/g, ''))}
                                    keyboardType="numeric"
                                />
                            </View>
                            {djTarifa && (
                                <Text style={styles.tarifaPreview}>
                                    {parseInt(djTarifa).toLocaleString('es-CL')} CLP/hora
                                </Text>
                            )}
                        </View>

                        {/* Ubicación */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ubicación</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Santiago, Metropolitana"
                                placeholderTextColor="#666"
                                value={djUbicacion}
                                onChangeText={setDjUbicacion}
                                maxLength={100}
                            />
                            <Text style={styles.characterCount}>{djUbicacion.length}/100</Text>
                        </View>

                        {/* Géneros musicales */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Géneros musicales</Text>
                            <Text style={styles.sectionSubtitle}>Selecciona los géneros que tocas</Text>
                            <View style={styles.generosGrid}>
                                {GENEROS_DISPONIBLES.map((genero) => (
                                    <TouchableOpacity
                                        key={genero}
                                        style={[
                                            styles.generoChip,
                                            selectedGeneros.includes(genero) && styles.generoChipSelected,
                                        ]}
                                        onPress={() => toggleGenero(genero)}
                                    >
                                        <Text
                                            style={[
                                                styles.generoText,
                                                selectedGeneros.includes(genero) && styles.generoTextSelected,
                                            ]}
                                        >
                                            {genero}
                                        </Text>
                                        {selectedGeneros.includes(genero) && (
                                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
                                                <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </Svg>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Agregar género personalizado */}
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.sectionSubtitle}>Agregar género personalizado</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Ej: Tech House"
                                        placeholderTextColor="#666"
                                        value={nuevoGenero}
                                        onChangeText={setNuevoGenero}
                                        maxLength={30}
                                    />
                                    <TouchableOpacity
                                        onPress={agregarGeneroPersonalizado}
                                        style={{
                                            backgroundColor: '#5B7EFF',
                                            borderRadius: 8,
                                            paddingHorizontal: 16,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>Agregar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Géneros personalizados */}
                            {customGeneros.length > 0 && (
                                <View style={{ marginTop: 16 }}>
                                    <Text style={styles.sectionSubtitle}>Tus géneros personalizados</Text>
                                    <View style={styles.generosGrid}>
                                        {customGeneros.map(genero => (
                                            <TouchableOpacity
                                                key={genero}
                                                style={[styles.generoChip, styles.generoChipSelected]}
                                                onPress={() => eliminarGeneroPersonalizado(genero)}
                                            >
                                                <Text style={[styles.generoText, styles.generoTextSelected]}>{genero}</Text>
                                                <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
                                                    <Path d="M18 6L6 18M6 6l12 12" />
                                                </Svg>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* 🎛️ Equipamiento */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🎛️ Equipamiento</Text>
                            
                            {/* Cuenta con equipamiento */}
                            <View style={styles.section}>
                                <Text style={styles.sectionSubtitle}>¿Cuentas con equipamiento?</Text>
                                <View style={styles.equipamientoOptionsContainer}>
                                    {OPCIONES_EQUIPAMIENTO.map((opcion) => (
                                        <TouchableOpacity
                                            key={opcion}
                                            style={[
                                                styles.equipamientoOption,
                                                cuentaConEquipamiento === opcion && styles.equipamientoOptionSelected,
                                            ]}
                                            onPress={() => {
                                                setCuentaConEquipamiento(opcion);
                                                // Si selecciona "No", limpiar equipamiento
                                                if (opcion === 'No') {
                                                    setSelectedEquipamiento([]);
                                                }
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.equipamientoOptionText,
                                                    cuentaConEquipamiento === opcion && styles.equipamientoOptionTextSelected,
                                                ]}
                                            >
                                                {opcion}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Seleccionar equipamiento específico (solo si cuenta con equipamiento) */}
                            {cuentaConEquipamiento !== 'No' && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionSubtitle}>Selecciona tu equipamiento</Text>
                                    <View style={styles.equipamientoGrid}>
                                        {EQUIPAMIENTO_DISPONIBLE.map((equipo) => (
                                            <TouchableOpacity
                                                key={equipo}
                                                style={[
                                                    styles.equipoChip,
                                                    selectedEquipamiento.includes(equipo) && styles.equipoChipSelected,
                                                ]}
                                                onPress={() => toggleEquipamiento(equipo)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.equipoText,
                                                        selectedEquipamiento.includes(equipo) && styles.equipoTextSelected,
                                                    ]}
                                                >
                                                    {equipo}
                                                </Text>
                                                {selectedEquipamiento.includes(equipo) && (
                                                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
                                                        <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                    </Svg>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* 🔥 Galería de fotos */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Galería de fotos 📸</Text>
                            <Text style={styles.sectionSubtitle}>Agrega fotos que verán los clientes cuando busquen tu perfil</Text>
                            
                            {/* Fotos actuales */}
                            {galleryImages.length > 0 && (
                                <View style={styles.galleryGrid}>
                                    {galleryImages.map((image, index) => (
                                        <View key={index} style={styles.galleryImageWrapper}>
                                            <Image
                                                source={{ uri: image.url }}
                                                style={styles.galleryImage}
                                            />
                                            <TouchableOpacity
                                                style={styles.removeGalleryButton}
                                                onPress={() => handleRemoveGalleryImage(index)}
                                            >
                                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                                                    <Path d="M18 6L6 18M6 6l12 12" />
                                                </Svg>
                                            </TouchableOpacity>
                                            {image.isNew && (
                                                <View style={styles.newBadge}>
                                                    <Text style={styles.newBadgeText}>Nuevo</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                            
                            {/* Botón para agregar fotos */}
                            <TouchableOpacity
                                style={styles.addGalleryButton}
                                onPress={handleAddGalleryImage}
                            >
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5B7EFF" strokeWidth={2}>
                                    <Path d="M12 5v14M5 12h14" />
                                </Svg>
                                <Text style={styles.addGalleryText}>Agregar foto ({galleryImages.length}/10)</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    /* CLIENT PROFILE FORM */
                    <>
                        {/* Nombre */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu nombre completo"
                                placeholderTextColor="#666"
                                value={clientNombre}
                                onChangeText={setClientNombre}
                                maxLength={50}
                            />
                            <Text style={styles.characterCount}>{clientNombre.length}/50</Text>
                        </View>

                        {/* Email (solo lectura) */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Email</Text>
                            <View style={styles.readOnlyInput}>
                                <Text style={styles.readOnlyText}>{clientEmail}</Text>
                            </View>
                            <Text style={styles.hint}>El email no puede ser modificado</Text>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </Text>
                </TouchableOpacity>
            </View>

            <BottomNavBar />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
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
        paddingHorizontal: 16,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    photoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#5B7EFF',
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    changePhotoOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#5B7EFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#111',
    },
    photoHint: {
        color: '#888',
        fontSize: 12,
        marginTop: 8,
    },
    section: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#888',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 14,
    },
    textAreaInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    readOnlyInput: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    readOnlyText: {
        color: '#888',
        fontSize: 14,
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'right',
    },
    hint: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    tarifaInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 12,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5B7EFF',
        marginRight: 8,
    },
    tarifaInput: {
        flex: 1,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 14,
    },
    tarifaPreview: {
        fontSize: 12,
        color: '#5B7EFF',
        marginTop: 6,
    },
    generosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    generoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: '#1a1a1a',
    },
    generoChipSelected: {
        backgroundColor: '#5B7EFF',
        borderColor: '#5B7EFF',
    },
    generoText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    generoTextSelected: {
        color: '#fff',
    },
    bottomButtonContainer: {
        paddingHorizontal: 16,
        paddingBottom: 80,
        paddingTop: 16,
    },
    saveButton: {
        backgroundColor: '#5B7EFF',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // 🔥 Estilos para galería
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    galleryImageWrapper: {
        position: 'relative',
        width: '31%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeGalleryButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: '#5B7EFF',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    addGalleryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#5B7EFF',
        borderStyle: 'dashed',
    },
    addGalleryText: {
        color: '#5B7EFF',
        fontSize: 14,
        fontWeight: '600',
    },
    // 🎛️ Estilos para equipamiento
    equipamientoOptionsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    equipamientoOption: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
    },
    equipamientoOptionSelected: {
        backgroundColor: '#5B7EFF',
        borderColor: '#5B7EFF',
    },
    equipamientoOptionText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    equipamientoOptionTextSelected: {
        color: '#fff',
    },
    equipamientoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    equipoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: '#1a1a1a',
    },
    equipoChipSelected: {
        backgroundColor: '#5B7EFF',
        borderColor: '#5B7EFF',
    },
    equipoText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    equipoTextSelected: {
        color: '#fff',
    },
});
