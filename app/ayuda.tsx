import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavBar';
import { useRole } from '../lib/RoleContext';

export default function AyudaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDJ } = useRole();

  // Si viene el parámetro mode='dj', forzamos modo DJ
  // Si viene mode='client', forzamos modo cliente
  // Si no viene nada, usamos el rol del usuario
  const isDJMode = params.mode === 'dj' || (isDJ && params.mode !== 'client');

  const faqs = [
    {
      question: '¿Cómo puedo contratar a un DJ?',
      answer: 'Busca DJs disponibles en la sección "Buscar DJs", revisa sus perfiles, reseñas y portafolios. Envía un mensaje directo para coordinar detalles.'
    },
    {
      question: '¿Qué información necesito para contratar?',
      answer: 'Fecha del evento, duración, tipo de evento, ubicación, presupuesto aproximado y preferencias musicales.'
    },
    {
      question: '¿Cómo funciona el sistema de pagos?',
      answer: 'Los pagos se procesan de forma segura a través de la plataforma. El 50% se paga al confirmar y el resto al finalizar el evento.'
    },
    {
      question: '¿Puedo cancelar una reserva?',
      answer: 'Sí, puedes cancelar hasta 48 horas antes del evento. Se aplican políticas de reembolso según los términos del DJ.'
    },
    {
      question: '¿Cómo contacto al soporte?',
      answer: 'Puedes contactarnos a través de la sección "Centro de Mensajes" o enviando un email a soporte@mivok.com'
    },
    {
      question: '¿Cómo cambio mi foto de perfil?',
      answer: 'Ve a "Editar Perfil" en el menú principal y selecciona "Cambiar foto".'
    },
    {
      question: '¿Cómo veo mis reseñas?',
      answer: 'Accede a "Mis Reseñas" desde el menú principal para ver todas tus valoraciones.'
    },
    {
      question: '¿Qué hago si tengo un problema con un DJ?',
      answer: 'Contacta al soporte inmediatamente. Revisaremos el caso y tomaremos las medidas necesarias.'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(isDJMode ? '/apartadodj' : '/apartadomascliente')}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.welcomeText}>
            ¿En qué podemos ayudarte?
          </Text>
          <Text style={styles.subtitle}>
            Encuentra respuestas a las preguntas más frecuentes
          </Text>

          <View style={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <View style={styles.questionContainer}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                  <Text style={styles.question}>{faq.question}</Text>
                </View>
                <Text style={styles.answer}>{faq.answer}</Text>
              </View>
            ))}
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>¿No encontraste lo que buscas?</Text>
            <Text style={styles.contactText}>
              Nuestro equipo de soporte está aquí para ayudarte
            </Text>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="mail" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Contactar Soporte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNavBar
        activeTab={isDJMode ? 'apartadomasdj' : 'apartadomascliente'}
        onHomePress={() => router.push(isDJMode ? '/home-dj' : '/home-cliente')}
        onEventosPress={() => router.push(isDJMode ? '/eventos-dj' : '/eventos-cliente' as any)}
        onSearchPress={() => router.push(isDJMode ? '/chats-dj' : '/chats-cliente')}
        onAlertasPress={() => router.push(isDJMode ? '/alertas-dj' : '/alertas-cliente')}
        onMasPress={() => router.push(isDJMode ? '/apartadodj' : '/apartadomascliente')}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 16,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 32,
  },
  faqContainer: {
    gap: 16,
    marginBottom: 32,
  },
  faqItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionNumber: {
    color: '#5B7EFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
  },
  question: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  answer: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  contactTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});