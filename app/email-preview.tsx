import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
    getBookingConfirmationHTML,
    getResetPasswordEmailHTML,
    getWelcomeEmailHTML
} from '../lib/email-service';

export default function EmailPreviewScreen() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<'welcome' | 'reset' | 'booking'>('welcome');

  const templates = {
    welcome: {
      title: '🎵 Email de Bienvenida',
      html: getWelcomeEmailHTML('Felipe García'),
      color: ['#667eea', '#764ba2']
    },
    reset: {
      title: '🔐 Reset de Contraseña',
      html: getResetPasswordEmailHTML('Felipe García', '123456'),
      color: ['#f093fb', '#f5576c']
    },
    booking: {
      title: '🎉 Confirmación de Booking',
      html: getBookingConfirmationHTML('Felipe García', 'DJ TrolazoMix', {
        fecha: '15 Diciembre 2025',
        hora: '20:00',
        lugar: 'Club Mivok, Santiago',
        precio: 250000,
        djId: 'dj123'
      }),
      color: ['#a8edea', '#fed6e3']
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={templates[selectedTemplate].color}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📧 Preview de Emails Bonitos</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Template Selector */}
      <View style={styles.templateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(templates).map(([key, template]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.templateButton,
                selectedTemplate === key && styles.templateButtonActive
              ]}
              onPress={() => setSelectedTemplate(key as any)}
            >
              <LinearGradient
                colors={selectedTemplate === key ? template.color : ['#f8f9fa', '#e9ecef']}
                style={styles.templateButtonGradient}
              >
                <Text style={[
                  styles.templateButtonText,
                  selectedTemplate === key && styles.templateButtonTextActive
                ]}>
                  {template.title}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Email Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>
          Vista previa: {templates[selectedTemplate].title}
        </Text>
        <View style={styles.webviewContainer}>
          <WebView
            source={{ html: templates[selectedTemplate].html }}
            style={styles.webview}
            scalesPageToFit={true}
            startInLoadingState={true}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#28a745', '#20c997']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Enviar Prueba</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#007bff', '#6f42c1']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="code" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Ver HTML</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  templateSelector: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  templateButton: {
    marginHorizontal: 5,
  },
  templateButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  templateButtonActive: {},
  templateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  templateButtonTextActive: {
    color: '#fff',
  },
  previewContainer: {
    flex: 1,
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  webview: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});