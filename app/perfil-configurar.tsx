import { useRouter } from 'expo-router';
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

interface DJProfile {
    id: string;
    nombre: string;
    descripcion: string;
    tarifa: string;
    generos: string[];
    imagen: string;
    eventosRealizados: number;
    anosEnApp: number;
}

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

export default function PerfilConfigurarScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<DJProfile>({
        id: '1',
        nombre: 'Mi Nombre',
        descripcion: 'Agregá una descripción sobre ti...',
        tarifa: '50000',
        generos: [],
        imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
        eventosRealizados: 0,
        anosEnApp: 0,
    });
    const [editingNombre, setEditingNombre] = useState(profile.nombre);
    const [editingDescripcion, setEditingDescripcion] = useState(profile.descripcion);
    const [editingTarifa, setEditingTarifa] = useState(profile.tarifa);
    const [selectedGeneros, setSelectedGeneros] = useState<string[]>(profile.generos);
    const [isSaving, setIsSaving] = useState(false);

    const loadProfile = useCallback(async () => {
        // TODO: Cargar desde Supabase o AsyncStorage
        setEditingNombre(profile.nombre);
        setEditingDescripcion(profile.descripcion);
        setEditingTarifa(profile.tarifa);
        setSelectedGeneros(profile.generos);
    }, [profile.nombre, profile.descripcion, profile.tarifa, profile.generos]);

    useEffect(() => {
        // Cargar perfil del almacenamiento local (en el futuro desde Supabase)
        loadProfile();
    }, [loadProfile]);

    const toggleGenero = (genero: string) => {
        setSelectedGeneros((prev) =>
            prev.includes(genero) ? prev.filter((g) => g !== genero) : [...prev, genero]
        );
    };

    const handleSaveProfile = async () => {
        if (!editingNombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }
        if (!editingDescripcion.trim()) {
            Alert.alert('Error', 'La descripción es obligatoria');
            return;
        }
        if (!editingTarifa.trim()) {
            Alert.alert('Error', 'La tarifa es obligatoria');
            return;
        }
        if (selectedGeneros.length === 0) {
            Alert.alert('Error', 'Debes seleccionar al menos un género');
            return;
        }

        setIsSaving(true);
        try {
            // TODO: Guardar en Supabase
            const updatedProfile: DJProfile = {
                ...profile,
                nombre: editingNombre,
                descripcion: editingDescripcion,
                tarifa: editingTarifa,
                generos: selectedGeneros,
            };
            setProfile(updatedProfile);
            setTimeout(() => {
                setIsSaving(false);
                Alert.alert('Éxito', 'Perfil actualizado correctamente', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }, 1000);
        } catch {
            setIsSaving(false);
            Alert.alert('Error', 'No se pudo guardar el perfil');
        }
    };

    const handleChangeImage = async () => {
        // TODO: Implementar image picker con expo-image-picker
        Alert.alert('Foto de perfil', 'Funcionalidad de cargador de fotos próximamente');
    };

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
                <Text style={styles.headerTitle}>Configurar Perfil</Text>
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
                    <View style={styles.photoContainer}>
                        <Image source={{ uri: profile.imagen }} style={styles.profileImage} />
                        <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangeImage}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                                <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <Path d="M12 3c6.015 0 10.674 4.692 10.974 10.5h2.026v3h-7v-3h2.026c-.3 -5.308 -5.02 -9.5 -10.026 -9.5c -5.595 0 -10.104 4.505 -10.104 10.004c0 5.498 4.509 10.004 10.104 10.004c4.874 0 8.949 -3.417 9.868 -8.02h2.11c-.923 5.32 -5.568 9.02 -11.978 9.02c -6.627 0 -12 -5.373 -12 -12s5.373 -12 12 -12z" />
                            </Svg>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.photoHint}>Toca para cambiar foto</Text>
                </View>

                {/* Nombre */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#666"
                        value={editingNombre}
                        onChangeText={setEditingNombre}
                        maxLength={50}
                    />
                    <Text style={styles.characterCount}>{editingNombre.length}/50</Text>
                </View>

                {/* Descripción */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <TextInput
                        style={[styles.input, styles.textAreaInput]}
                        placeholder="Cuéntame sobre ti y tu experiencia como DJ..."
                        placeholderTextColor="#666"
                        value={editingDescripcion}
                        onChangeText={setEditingDescripcion}
                        multiline
                        maxLength={500}
                    />
                    <Text style={styles.characterCount}>{editingDescripcion.length}/500</Text>
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
                            value={editingTarifa}
                            onChangeText={(text) => setEditingTarifa(text.replace(/[^0-9]/g, ''))}
                            keyboardType="numeric"
                        />
                    </View>
                    {editingTarifa && (
                        <Text style={styles.tarifaPreview}>
                            {parseInt(editingTarifa).toLocaleString('es-CL')} CLP/hora
                        </Text>
                    )}
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
                </View>

                {/* Estadísticas (solo lectura) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Estadísticas</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{profile.eventosRealizados}</Text>
                            <Text style={styles.statLabel}>Eventos realizados</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{profile.anosEnApp}</Text>
                            <Text style={styles.statLabel}>Años en la app</Text>
                        </View>
                    </View>
                    <Text style={styles.statsHint}>
                        Las estadísticas se actualizan automáticamente con tus eventos confirmados.
                    </Text>
                </View>
            </ScrollView>

            {/* Botón guardar fijo */}
            <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 10 }]}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        gap: 12,
        backgroundColor: '#111',
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
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1a1a1a',
    },
    changePhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#5B7EFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoHint: {
        fontSize: 12,
        color: '#999',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 10,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#999',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 14,
    },
    textAreaInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    characterCount: {
        fontSize: 11,
        color: '#666',
        marginTop: 6,
        textAlign: 'right',
    },
    tarifaInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFB800',
        marginRight: 8,
    },
    tarifaInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
    },
    tarifaPreview: {
        fontSize: 12,
        color: '#5B7EFF',
        marginTop: 8,
        fontWeight: '500',
    },
    generosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    generoChip: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    generoChipSelected: {
        backgroundColor: '#5B7EFF',
        borderColor: '#5B7EFF',
    },
    generoText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    generoTextSelected: {
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#5B7EFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
    },
    statsHint: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#111',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    saveButton: {
        backgroundColor: '#5B7EFF',
        borderRadius: 12,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
