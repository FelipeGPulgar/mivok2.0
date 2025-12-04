import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PaymentSummaryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const monto = params.monto ? Number(params.monto) : 0;
  const email = params.email || '';
  const nombreEvento = params.nombreEvento || 'Evento';
  const tipo = params.tipo || 'success';

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View style={{ height: 40 }} />
        <Text style={styles.title}>¡Pago realizado!</Text>
        <Text style={styles.subtitle}>Monto pagado: <Text style={styles.amount}>$ {monto.toLocaleString('es-CL')}</Text></Text>
        <Text style={styles.eventName}>{nombreEvento}</Text>
        <Text style={styles.emailText}>Recibo a: {email}</Text>
        <Text style={styles.statusText}>El pago se encuentra RETENIDO y será liberado cuando el evento sea confirmado por ambos participantes.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>¿Qué sucede ahora?</Text>
        <Text style={styles.cardText}>
          • Cuando termine el evento, tanto DJ como cliente deberán confirmar si se realizó correctamente.
        </Text>
        <Text style={styles.cardText}>
          • Si AMBOS confirman, el pago se libera al DJ.
        </Text>
        <Text style={styles.cardText}>
          • Si uno rechaza, se aplican las reglas de devolución según culpa.
        </Text>
        <Text style={styles.cardText}>
          Puedes ver el seguimiento y confirmar en la sección de "Mis eventos". Todas las notificaciones llegarán a tu email.
        </Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/eventos-cliente')}>
        <Text style={styles.btnText}>Ir a mis eventos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#5B7EFF', marginTop: 8 }]}
        onPress={() => router.replace('/mock-email')}
      >
        <Text style={[styles.btnText, { color: '#5B7EFF' }]}>📧 Ver resumen por correo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#10B981', fontSize: 25, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#fff', fontSize: 17, fontWeight: '400', marginBottom: 5 },
  amount: { color: '#5B7EFF', fontSize: 20, fontWeight: 'bold' },
  eventName: { color: '#eee', fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
  emailText: { color: '#ccc', fontSize: 13, marginBottom: 10 },
  statusText: { color: '#FFB800', fontSize: 15, fontWeight: '600', textAlign: 'center', marginVertical: 8 },
  card: { backgroundColor: '#191919', borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 24, width: '100%' },
  cardTitle: { color: '#5B7EFF', fontWeight: '700', fontSize: 17, marginBottom: 8 },
  cardText: { color: '#bbb', fontSize: 15, marginBottom: 4 },
  btn: { backgroundColor: '#5B7EFF', borderRadius: 10, padding: 16, marginVertical: 12, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
