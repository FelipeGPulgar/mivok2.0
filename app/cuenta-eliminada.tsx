import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CuentaEliminadaScreen() {
  const router = useRouter();

  useEffect(() => {
    // Aquí podrías implementar la lógica de eliminación de cuenta
    // Por ahora solo mostramos la pantalla
  }, []);

  const handleEntendido = () => {
    // Redirigir al inicio de la app
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#5B7EFF" />
        </View>

        <Text style={styles.title}>Cuenta Eliminada</Text>

        <Text style={styles.message}>
          Tu cuenta ha sido suspendida temporalmente. Durante las próximas 24 horas,
          podrás recuperar tu cuenta contactando al soporte.
        </Text>

        <Text style={styles.message}>
          Después de 24 horas, tu cuenta será eliminada permanentemente y todos
          tus datos serán removidos de nuestros servidores.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#5B7EFF" />
          <Text style={styles.infoText}>
            Si cambias de opinión, contacta inmediatamente a soporte@mivok.com
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleEntendido}
        >
          <Text style={styles.buttonText}>Entendido</Text>
        </TouchableOpacity>

        <Text style={styles.thanksText}>
          Gracias por haber sido parte de Mivok
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  infoText: {
    color: '#5B7EFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  thanksText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});