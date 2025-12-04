
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function PaymentResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log('PaymentResult Params:', JSON.stringify(params, null, 2));

  const [userRole, setUserRole] = useState<string>(params.role as string || 'client');

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

  const tipo = params.tipo || 'liberado'; // 'liberado', 'devolucion_cliente', 'devolucion_dj'
  const monto = params.monto ? Number(params.monto) : 0;
  const porcentajeDJ = params.porcentajeDJ ? Number(params.porcentajeDJ) : 0;
  const porcentajeCliente = params.porcentajeCliente ? Number(params.porcentajeCliente) : 0;
  const motivo = params.motivo || '';

  const montoDJ = Math.round(monto * (porcentajeDJ / 100));
  const montoCliente = Math.round(monto * (porcentajeCliente / 100));

  const getTitle = () => {
    if (tipo === 'liberado') return '✅ Pago liberado';
    if (tipo === 'devolucion_cliente') return '💰 Devolución procesada';
    if (tipo === 'devolucion_dj') return '💰 Devolución completa';
    return '✅ Proceso completado';
  };

  const getColor = () => {
    if (tipo === 'liberado') return '#10B981';
    return '#FFB800';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ height: 40 }} />
        <Text style={[styles.title, { color: getColor() }]}>{getTitle()}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de transacción</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monto total:</Text>
            <Text style={styles.summaryValue}>$ {monto.toLocaleString('es-CL')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>DJ recibe:</Text>
            <Text style={[styles.summaryValue, { color: '#5B7EFF' }]}>
              $ {montoDJ.toLocaleString('es-CL')} ({porcentajeDJ}%)
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cliente recibe:</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              $ {montoCliente.toLocaleString('es-CL')} ({porcentajeCliente}%)
            </Text>
          </View>
          {motivo ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.motivoLabel}>Motivo:</Text>
              <Text style={styles.motivoText}>{motivo}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📧 Confirmación por correo</Text>
          <Text style={styles.infoText}>
            Se ha enviado un resumen detallado de esta transacción a tu correo electrónico.
          </Text>
          <Text style={styles.infoText}>
            El proceso de transferencia puede tardar 1 día hábil.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => router.replace({
            pathname: '/mock-email',
            params: {
              role: userRole,
              monto,
              tipo,
              motivo
            }
          })}
        >
          <Text style={styles.emailButtonText}>📧 Ver resumen de correo</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
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
  content: { padding: 20, alignItems: 'center' },
  logo: { width: 80, height: 80, marginBottom: 20, resizeMode: 'contain' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  summaryCard: {
    backgroundColor: '#191919',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: { color: '#999', fontSize: 14 },
  summaryValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 12,
  },
  motivoLabel: { color: '#999', fontSize: 12, marginTop: 8, marginBottom: 4 },
  motivoText: { color: '#bbb', fontSize: 13, fontStyle: 'italic' },
  infoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: { color: '#3b82f6', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoText: { color: '#ddd', fontSize: 13, marginBottom: 6, lineHeight: 20 },
  emailButton: {
    backgroundColor: '#5B7EFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  emailButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: {
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

