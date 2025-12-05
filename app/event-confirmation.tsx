import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { confirmEventRealization } from '../lib/events-functions';
import { supabase } from '../lib/supabase';

export default function EventConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const eventId = params.eventId as string;
  const monto = params.monto ? Number(params.monto) : 0;
  const role = (params.role as 'client' | 'dj') || 'client';
  const nombreEvento = params.nombreEvento || 'Evento';

  // Check if already confirmed on focus
  useFocusEffect(
    useCallback(() => {
      const checkStatus = async () => {
        if (!eventId) return;
        try {
          const { getEventById } = require('../lib/events-functions'); // Lazy import to avoid cycle if any
          const ev = await getEventById(eventId);
          if (ev) {
            // Check payment status FIRST if DJ
            let currentPaymentStatus = null;
            if (role === 'dj') {
              console.log('🔍 Checking payment status for DJ. EventID:', eventId);
              const { data: payments, error: paymentError } = await supabase
                .from('pagos')
                .select('estado')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false })
                .limit(1);

              if (paymentError) {
                console.error('❌ Error fetching payment:', paymentError);
              }

              if (payments && payments.length > 0) {
                const payment = payments[0];
                console.log('✅ Payment found:', payment);
                currentPaymentStatus = payment.estado;
                setPaymentStatus(payment.estado);
              } else {
                console.warn('⚠️ No payment record found for event:', eventId);
              }
            }

            // 🔍 Debug: Mostrar el estado actual del evento
            console.log('🔍 Estado del evento:', {
              eventId: ev.id,
              estado: ev.estado,
              dj_confirmed_at: ev.dj_confirmed_at,
              client_confirmed_at: ev.client_confirmed_at,
              role: role
            });

            // Si el evento ya está completado Y LA PERSONA ACTUAL ya confirmó, redirigir o mostrar estado final
            const currentUserConfirmed = role === 'dj' ? ev.dj_confirmed_at : ev.client_confirmed_at;
            if (ev.estado === 'completado' && currentUserConfirmed) {
              console.log(`🎯 ${role.toUpperCase()} ya confirmó anteriormente, mostrando opciones finales`);
              Alert.alert(
                '✅ Evento ya confirmado',
                `Ya confirmaste que este evento se realizó correctamente.`,
                [
                  {
                    text: role === 'dj'
                      ? (currentPaymentStatus === 'LIBERADO' ? 'Ver Comprobante' : 'Gestionar Pago (Kushki)')
                      : 'Ver resumen',
                    onPress: () => {
                      if (role === 'dj') {
                        if (currentPaymentStatus === 'LIBERADO') {
                          router.push({
                            pathname: '/comprobante-kushki',
                            params: {
                              monto,
                              nombreEvento,
                              token: `TX-${eventId.slice(0, 8).toUpperCase()}` // Mock token based on event ID
                            }
                          });
                        } else {
                          router.push({
                            pathname: '/kushki-chat',
                            params: { eventId, monto }
                          });
                        }
                      } else {
                        router.replace({
                          pathname: '/payment-result',
                          params: {
                            tipo: 'liberado',
                            monto,
                            porcentajeDJ: 100,
                            porcentajeCliente: 0,
                            motivo: 'Evento completado exitosamente',
                            role,
                          }
                        });
                      }
                    },
                  }
                ]
              );
              return;
            }

            // 🔍 Si el evento está completado pero LA PERSONA ACTUAL no ha confirmado, mostrar pregunta
            if (ev.estado === 'completado' && !currentUserConfirmed) {
              console.log(`📝 Evento completado pero ${role.toUpperCase()} no ha confirmado, mostrando pantalla de confirmación`);
              // No hacer return, continuar con la lógica normal de confirmación
            }

            const myConfirmation = role === 'client' ? ev.client_confirmed_at : ev.dj_confirmed_at;
            if (myConfirmation) {
              setConfirmed(true);
            }
          }
        } catch (e) {
          console.error('Error checking status:', e);
        }
      };
      checkStatus();
    }, [eventId, role, paymentStatus]) // Added paymentStatus dependency to ensure alert uses latest state
  );

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { success, bothConfirmed, error } = await confirmEventRealization(eventId, role);

      if (!success) {
        Alert.alert('Error', 'No se pudo confirmar el evento. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      if (bothConfirmed) {
        // Ambos confirman: Mostrar modal de confirmación y directo a pago
        Alert.alert(
          '🎉 ¡Evento Completado!',
          role === 'dj' 
            ? 'Ambas partes han confirmado que el evento se realizó correctamente.\n\n💰 El pago completo será liberado a tu cuenta.\n\n¿Deseas gestionar tu pago ahora?'
            : `El evento ha sido confirmado exitosamente.\n\n💰 Pago liberado al DJ: $${monto.toLocaleString('es-CL')}`,
          [
            {
              text: role === 'dj' ? '💳 Gestionar Pago (Kushki)' : 'Ver Resumen',
              style: 'default',
              onPress: () => {
                if (role === 'dj') {
                  router.replace({
                    pathname: '/kushki-chat',
                    params: { eventId, monto }
                  });
                } else {
                  router.replace({
                    pathname: '/payment-result',
                    params: {
                      tipo: 'liberado',
                      monto,
                      porcentajeDJ: 100,
                      porcentajeCliente: 0,
                      motivo: 'Evento completado exitosamente',
                      role,
                    }
                  });
                }
              },
            },
            {
              text: 'Más Tarde',
              style: 'cancel',
              onPress: () => {
                if (role === 'dj') {
                  router.replace('/eventos-dj');
                } else {
                  router.replace('/eventos-cliente');
                }
              }
            }
          ]
        );
      } else {
        setConfirmed(true); // Mark as confirmed locally to show waiting UI
        Alert.alert(
          '✅ Confirmación registrada',
          'Tu confirmación ha sido registrada. El pago se liberará automáticamente cuando la otra parte también confirme.',
          [{
            text: 'OK',
            onPress: () => {
              // Optional: navigate back or stay on screen showing "Waiting"
              // For now, let's stay to show the waiting UI
            }
          }]
        );
      }
    } catch (e) {
      console.error('Error confirming:', e);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      '⚠️ Reportar problema',
      '¿Cuál es el motivo del problema?',
      [
        {
          text: 'Cliente canceló',
          onPress: () => {
            // Cliente cancela: 80% devolución cliente, 20% DJ
            const montoCliente = Math.round(monto * 0.8);
            const montoDJ = monto - montoCliente;

            Alert.alert(
              '💰 Devolución procesada',
              `Cancelación por parte del cliente.\n\nDevolución:\n• Cliente recibe: $ ${montoCliente.toLocaleString('es-CL')} (80%)\n• DJ recibe: $ ${montoDJ.toLocaleString('es-CL')} (20%)\n\nSe enviará un resumen por correo.`,
              [
                {
                  text: 'Ver resumen',
                  onPress: () => router.replace({
                    pathname: '/payment-result',
                    params: {
                      tipo: 'devolucion_cliente',
                      monto,
                      porcentajeDJ: 20,
                      porcentajeCliente: 80,
                      motivo: 'Cancelación por parte del cliente',
                      role,
                    }
                  }),
                },
                { text: 'Cerrar', onPress: () => router.replace('/eventos-cliente') }
              ]
            );
          },
        },
        {
          text: 'DJ no se presentó',
          onPress: () => {
            // DJ cancela: 100% devolución cliente
            Alert.alert(
              '💰 Devolución completa',
              `El DJ no se presentó al evento.\n\nDevolución:\n• Cliente recibe: $ ${monto.toLocaleString('es-CL')} (100%)\n• DJ recibe: $0\n\nSe enviará un resumen por correo.`,
              [
                {
                  text: 'Ver resumen',
                  onPress: () => router.replace({
                    pathname: '/payment-result',
                    params: {
                      tipo: 'devolucion_dj',
                      monto,
                      porcentajeDJ: 0,
                      porcentajeCliente: 100,
                      motivo: 'DJ no se presentó al evento',
                      role,
                    }
                  }),
                },
                { text: 'Cerrar', onPress: () => router.replace('/eventos-cliente') }
              ]
            );
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {confirmed ? 'Estado de confirmación' : 'Confirmar realización del evento'}
        </Text>
        <Text style={styles.subtitle}>{nombreEvento}</Text>
        <Text style={styles.amount}>Monto: $ {monto.toLocaleString('es-CL')}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿El evento se realizó correctamente?</Text>
          <Text style={styles.infoText}>
            • Si AMBOS confirman: El pago se libera completamente al DJ (100%).
          </Text>
          <Text style={styles.infoText}>
            • Si el CLIENTE cancela: Cliente recibe 80%, DJ recibe 20%.
          </Text>
          <Text style={styles.infoText}>
            • Si el DJ no se presenta: Cliente recibe 100% de devolución.
          </Text>
        </View>

        {!confirmed ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>✅ Sí, se realizó correctamente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Text style={styles.rejectButtonText}>❌ No, hubo un problema</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingText}>⏳ Esperando confirmación de la otra parte...</Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (role === 'dj') {
                  router.replace('/eventos-dj');
                } else {
                  router.replace('/eventos-cliente');
                }
              }}
            >
              <Text style={styles.backButtonText}>Volver a mis eventos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#5B7EFF', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  amount: { color: '#FFB800', fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  infoCard: {
    backgroundColor: '#191919',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoTitle: { color: '#5B7EFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  infoText: { color: '#bbb', fontSize: 14, marginBottom: 8, lineHeight: 20 },
  actions: { gap: 12 },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  waitingCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  waitingText: { color: '#FFB800', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  backButton: {
    marginTop: 20,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

