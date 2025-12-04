import React, { useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const TEST_PUBLIC_KEY = 'TEST-e852c397-3f1e-41a5-b43a-3adc1fb7aecc';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [processing, setProcessing] = useState(false);

  const monto = params.monto ? Number(params.monto) : 0;
  const email = params.email || 'cliente_prueba@mivok.cl';
  const nombreEvento = params.nombreEvento || 'Evento con DJ';
  const eventId = params.eventId || '';
  const onSuccessRoute = params.onSuccessRoute || '/payment-summary';
  const onCancelRoute = params.onCancelRoute || '/home-cliente';

  const handlePay = async () => {
    setProcessing(true);
    // Simular proceso de pago (2 segundos)
    setTimeout(() => {
      setProcessing(false);
      router.replace({
        pathname: onSuccessRoute,
        params: { monto, email, nombreEvento, eventId, tipo: 'success' }
      });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pagar con Mercado Pago</Text>
        <Text style={styles.headerSubtitle}>Monto: $ {monto.toLocaleString('es-CL')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Image
          source={{ uri: 'https://cdn.mercadopago.cl/images/v1/checkout/logo_mp.png' }}
          style={styles.logo}
        />
        <Text style={styles.title}>Resumen del pago</Text>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Evento:</Text>
            <Text style={styles.summaryValue}>{nombreEvento}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monto:</Text>
            <Text style={styles.summaryAmount}>$ {monto.toLocaleString('es-CL')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>{email}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Información importante</Text>
          <Text style={styles.infoText}>
            • El pago será RETENIDO hasta que el evento se complete y ambas partes lo confirmen.
          </Text>
          <Text style={styles.infoText}>
            • Si ambos confirman, el pago se libera al DJ.
          </Text>
          <Text style={styles.infoText}>
            • Si hay problemas, se aplican las reglas de devolución según culpa.
          </Text>
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.methodsTitle}>Métodos de pago disponibles:</Text>
          <Text style={styles.methodText}>💳 Tarjeta de crédito/débito</Text>
          <Text style={styles.methodText}>🏦 Transferencia bancaria</Text>
          <Text style={styles.methodText}>💰 Saldo Mercado Pago</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pagar $ {monto.toLocaleString('es-CL')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace(onCancelRoute)}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: {
    backgroundColor: '#191919',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 20, marginBottom: 4 },
  headerSubtitle: { color: '#5B7EFF', fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 20, resizeMode: 'contain' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  summaryCard: {
    backgroundColor: '#191919',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: { color: '#999', fontSize: 14 },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  summaryAmount: { color: '#5B7EFF', fontSize: 18, fontWeight: '700' },
  infoCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB800',
  },
  infoTitle: { color: '#FFB800', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoText: { color: '#ddd', fontSize: 13, marginBottom: 6, lineHeight: 20 },
  paymentMethods: {
    backgroundColor: '#191919',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  methodsTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  methodText: { color: '#bbb', fontSize: 14, marginBottom: 8 },
  footer: {
    backgroundColor: '#191919',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  payButton: {
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelButton: {
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: { color: '#999', fontSize: 14 },
});
