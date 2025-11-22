import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import * as profileFunctions from '../lib/profile-functions';
import { getCurrentUser } from '../lib/supabase';

interface GalleryImage {
  id: string;
  user_id: string;
  image_url: string;
  order: number;
  created_at: string;
}

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 3; // 3 columnas con padding

export default function GaleriaDJScreen() {
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setImages([]);
        return;
      }

      const galleryImages = await profileFunctions.getDJGalleryImages(user.id);
      setImages(galleryImages || []);
    } catch (error) {
      console.error('❌ Error cargando galería:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGallery();
    }, [loadGallery])
  );

  const handleAddPhoto = () => {
    Alert.alert(
      'Agregar Foto',
      '¿Cómo quieres agregar una foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar Foto',
          onPress: takePhoto,
        },
        {
          text: 'Seleccionar de Galería',
          onPress: pickImage,
        },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      // Solicitar permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a la cámara.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto.');
    }
  };

  const pickImage = async () => {
    try {
      // Solicitar permisos de galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a la galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado.');
        return;
      }

      if (!asset.base64) {
        Alert.alert('Error', 'No se pudo obtener la imagen.');
        return;
      }

      // Subir a Supabase Storage
      const imageUrl = await profileFunctions.uploadDJGalleryImage(
        user.id,
        asset.base64,
        `photo_${Date.now()}`
      );

      if (!imageUrl) {
        Alert.alert('Error', 'No se pudo subir la imagen.');
        return;
      }

      // Agregar a la tabla dj_gallery_images
      const success = await profileFunctions.addDJGalleryImage(
        user.id,
        imageUrl,
        images.length // orden al final
      );

      if (success) {
        // Recargar galería
        await loadGallery();
        Alert.alert('Éxito', 'Foto agregada a tu galería.');
      } else {
        Alert.alert('Error', 'No se pudo agregar la foto a la galería.');
      }
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      Alert.alert('Error', 'Ocurrió un error al subir la imagen.');
    }
  };

  const handleDeletePhoto = (image: GalleryImage) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro que quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await profileFunctions.removeDJGalleryImage(image.id);
              if (success) {
                setImages(prev => prev.filter(img => img.id !== image.id));
                Alert.alert('Eliminada', 'La foto fue eliminada correctamente.');
              } else {
                Alert.alert('Error', 'No se pudo eliminar la foto.');
              }
            } catch (error) {
              console.error('❌ Error eliminando foto:', error);
              Alert.alert('Error', 'Ocurrió un error al eliminar la foto.');
            }
          },
        },
      ]
    );
  };

  const renderImage = ({ item }: { item: GalleryImage }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => setSelectedImage(item)}
      onLongPress={() => handleDeletePhoto(item)}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images" size={64} color="#666" />
      <Text style={styles.emptyTitle}>Sin fotos</Text>
      <Text style={styles.emptySubtitle}>
        Agrega fotos de tus eventos para mostrar tu trabajo
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Agregar Foto</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#5B7EFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Mi Galería</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddPhoto}>
          <Ionicons name="add" size={24} color="#5B7EFF" />
        </TouchableOpacity>
      </View>

      {/* Gallery Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando fotos...</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImage}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" style={styles.closeIcon} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage.image_url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavBar
        activeTab="apartadomasdj"
        onHomePress={() => router.push('/home-dj')}
        onEventosPress={() => router.push('/eventos-dj' as any)}
        onSearchPress={() => router.push('/chats-dj')}
        onAlertasPress={() => router.push('/alertas-dj')}
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
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  imageContainer: {
    width: imageSize,
    height: imageSize,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  image: {
    width: '100%',
    height: '100%',
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
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeIcon: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 8,
  },
  fullImage: {
    width: width - 40,
    height: width - 40,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
});