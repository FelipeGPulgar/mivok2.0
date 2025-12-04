import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function MockEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [userRole, setUserRole] = useState<string>((params.role as string) || 'client');

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    // If explicitly passed, trust it.
    if (params.role === 'dj') {
      setUserRole('dj');
      return;
    }
    if (params.role === 'client') {
      setUserRole('client');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_dj')
          .eq('user_id', user.id)
          .single();

        if (profile?.is_dj) {
          setUserRole('dj');
        }
      }
    } catch (e) {
      console.error('Error checking role:', e);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emailHeader}>
          <View style={{ height: 40 }} />
          <Text style={styles.emailFrom}>De: Equipo KushkiPagos &lt;noreply@kushkipagos.com&gt;</Text>
          <Text style={styles.emailTo}>Para: tu@email.com</Text>
          <Text style={styles.emailSubject}>Asunto: Resumen de transacción</Text>
        </View>

        <View style={styles.emailBody}>
          <Text style={styles.emailGreeting}>Hola,</Text>
          <Text style={styles.emailText}>
            Te enviamos este correo para confirmar que tu transacción ha sido procesada correctamente.
          </Text>
          <Text style={styles.emailText}>
            <Text style={styles.bold}>Resumen de la transacción:</Text>
          </Text>
          <View style={styles.emailDetails}>
            <Text style={styles.emailDetail}>• Servicio: Evento con DJ</Text>
            <Text style={styles.emailDetail}>• Plataforma: Mivok</Text>
            <Text style={styles.emailDetail}>• Estado: Procesado</Text>
            <Text style={styles.emailDetail}>• Fecha: {new Date().toLocaleDateString('es-CL')}</Text>
          </View>
          <Text style={styles.emailText}>
            Puedes ver el detalle completo de tu transacción en la sección de "Mis eventos".
          </Text>
          <Text style={styles.emailText}>
            Si tienes alguna consulta, no dudes en contactarnos.
          </Text>
          <Text style={styles.emailSignature}>
            Saludos,{'\n'}
            Equipo KushkiPagos
          </Text>
        </View>

        <View style={styles.emailFooter}>
          <Text style={styles.footerText}>
            Este es un correo automático, por favor no respondas a este mensaje.
          </Text>
          <Text style={styles.footerText}>
            Soporte: soporte@mivok.cl
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (userRole === 'dj') {
              router.replace('/eventos-dj');
            } else {
              router.replace('/eventos-cliente');
            }
          }}
        >
          <Text style={styles.buttonText}>Volver a mis eventos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 20 },
  emailHeader: {
    backgroundColor: '#191919',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  logo: { width: 60, height: 60, marginBottom: 12, resizeMode: 'contain' },
  emailFrom: { color: '#5B7EFF', fontSize: 12, marginBottom: 4 },
  emailTo: { color: '#999', fontSize: 12, marginBottom: 4 },
  emailSubject: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 },
  emailBody: {
    backgroundColor: '#191919',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  emailGreeting: { color: '#fff', fontSize: 16, marginBottom: 12 },
  emailText: { color: '#ddd', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#fff' },
  emailDetails: {
    backgroundColor: '#111',
    borderRadius: 6,
    padding: 12,
    marginVertical: 12,
  },
  emailDetail: { color: '#bbb', fontSize: 13, marginBottom: 6 },
  emailSignature: { color: '#999', fontSize: 13, marginTop: 16, fontStyle: 'italic' },
  emailFooter: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  footerText: { color: '#666', fontSize: 11, textAlign: 'center', marginBottom: 4 },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  button: {
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
