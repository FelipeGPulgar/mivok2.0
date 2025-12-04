import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import type { EventRow } from '../lib/db-types';
import { cancelEvent, deleteEvent, finalizeCompletedEvents, listEventsForUser } from '../lib/events-functions';
import { formatCLP } from '../lib/formatters';
import { getCurrentUser } from '../lib/supabase';

export default function EventosClienteScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState<EventRow | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setEvents([]);
        return;
      }

      // Finalizar eventos completados automáticamente
      await finalizeCompletedEvents(user.id as string, 'client');

      const data = await listEventsForUser(user.id as string, 'client');
      setEvents(data);
    } catch (e) {
      console.error('❌ Error cargando eventos Cliente:', e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const empty = useMemo(() => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth={2}>
          <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <Path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
          <Path d="M16 3v4" />
          <Path d="M8 3v4" />
          <Path d="M4 11h16" />
        </Svg>
      </View>
      <Text style={styles.emptyTitle}>No tienes eventos</Text>
      <Text style={styles.emptySub}>Cuando reserves un DJ, tus eventos aparecerán aquí</Text>
    </View>
  ), []);

  const openOptions = (ev: EventRow) => setSelected(ev);
  const closeOptions = () => setSelected(null);

  const handleChat = () => {
    // Navegar al centro de mensajes del cliente
    closeOptions();
    router.push('/chats-cliente');
  };

  const handleCancelOrDelete = async () => {
    if (!selected) return;

    // If event is finalized -> offer review and delete
    if (selected.estado === 'completado') {
      Alert.alert(
        'Evento completado',
        'Este evento ya pasó. ¿Qué te gustaría hacer?',
        [
          { text: 'Cerrar', style: 'cancel' },
          {
            text: 'Dejar reseña al DJ',
            onPress: () => {
              closeOptions();
              // Navegar a pantalla de reseñas con parámetros
              router.push({
                pathname: '/reviews',
                params: {
                  mode: 'client',
                  eventId: selected.id,
                  revieweeId: selected.dj_id,
                  revieweeName: 'DJ', // TODO: Obtener nombre real del DJ
                },
              });
            },
          },
          {
            text: 'Eliminar evento',
            style: 'destructive',
            onPress: async () => {
              try {
                const ok = await deleteEvent(selected.id);
                if (ok) {
                  Alert.alert('Eliminado', 'El evento fue eliminado correctamente.');
                  closeOptions();
                  await fetchEvents();
                } else {
                  Alert.alert('Error', 'No se pudo eliminar el evento (revisa permisos).');
                }
              } catch (e) {
                console.error('❌ Error eliminando evento desde UI:', e);
                Alert.alert('Error', 'Ocurrió un error al eliminar el evento.');
              }
            },
          },
        ],
      );
      return;
    }

    // If event already cancelled -> offer permanent delete
    if (selected.estado === 'cancelado') {
      Alert.alert(
        'Eliminar evento',
        'Este evento está cancelado. ¿Deseas eliminar permanentemente este registro? Esta acción no se puede deshacer.',
        [
          { text: 'No, conservar', style: 'cancel' },
          {
            text: 'Sí, eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                const ok = await deleteEvent(selected.id);
                if (ok) {
                  Alert.alert('Eliminado', 'El evento fue eliminado correctamente.');
                  closeOptions();
                  await fetchEvents();
                } else {
                  Alert.alert('Error', 'No se pudo eliminar el evento (revisa permisos).');
                }
              } catch (e) {
                console.error('❌ Error eliminando evento desde UI:', e);
                Alert.alert('Error', 'Ocurrió un error al eliminar el evento.');
              }
            },
          },
        ],
      );
      return;
    }

    // Otherwise, confirm cancellation
    Alert.alert(
      '¿Cancelar evento?',
      'Si cancelas ahora, se te reembolsará solo el 80% del valor pagado (10% compensación DJ, 10% gastos administrativos).\n\n¿Deseas continuar?',
      [
        { text: 'No, mantener evento', style: 'cancel' },
        {
          text: 'Sí, cancelar y aceptar penalización',
          style: 'destructive',
          onPress: async () => {
            try {
              const ok = await cancelEvent(selected.id, 'client');
              if (ok) {
                Alert.alert('Evento cancelado', 'El evento ha sido cancelado y el reembolso parcial procesado.');
                closeOptions();
                await fetchEvents();
              } else {
                Alert.alert('Error', 'No se pudo cancelar el evento.');
              }
            } catch (e) {
              console.error('❌ Error cancelando evento desde UI:', e);
              Alert.alert('Error', 'Ocurrió un error al cancelar el evento.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Mis Eventos</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={[styles.listContent, events.length === 0 && { flex: 1 }]}
        ListEmptyComponent={!loading ? empty : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => openOptions(item)}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarSmall}>
                <Text style={{ color: '#111', fontWeight: '900' }}>🎧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>DJ contratado</Text>
                <Text style={styles.cardSub}>{item.ubicacion}</Text>
              </View>
              <View>
                {(() => {
                  if (item.estado === 'completado') {
                    return <View style={styles.badgeFinalized}><Text style={styles.badgeTextFinalized}>Completado</Text></View>;
                  } else if (item.estado === 'cancelado') {
                    return <View style={styles.badgeCancelled}><Text style={styles.badgeTextCancelled}>Cancelado</Text></View>;
                  } else {
                    return <View style={styles.badgeOk}><Text style={styles.badgeText}>Confirmado</Text></View>;
                  }
                })()}
              </View>
            </View>
            <View style={styles.cardBodyRow}>
              <Text style={styles.metaLabel}>Fecha:</Text>
              <Text style={styles.metaValue}>{item.fecha}</Text>
            </View>
            <View style={styles.cardBodyRow}>
              <Text style={styles.metaLabel}>Monto pagado:</Text>
              <Text style={styles.metaValue}>{formatCLP(item.monto_final)}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.metaHint}>
                {(() => {
                  if (item.estado === 'completado') {
                    return 'Toca para opciones (reseña/eliminar)';
                  } else if (item.estado === 'cancelado') {
                    return 'Toca para opciones (chat/eliminar)';
                  } else {
                    return 'Toca para opciones (chat/cancelar)';
                  }
                })()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal de opciones */}
      <Modal transparent visible={!!selected} animationType="fade" onRequestClose={closeOptions}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Opciones para tu evento</Text>
            <Text style={styles.modalSub}>¿Qué te gustaría hacer con este evento?</Text>

            <TouchableOpacity style={styles.primaryAction} onPress={handleChat}>
              <Text style={styles.primaryActionText}>Chatear con DJ</Text>
            </TouchableOpacity>

            {selected?.estado === 'completado' && (
              <TouchableOpacity
                style={[styles.secondaryAction, { backgroundColor: '#5B7EFF' }]}
                onPress={() => {
                  closeOptions();
                  router.push({
                    pathname: '/event-confirmation',
                    params: {
                      eventId: selected.id,
                      monto: selected.monto_final,
                      role: 'client',
                      nombreEvento: selected.ubicacion || 'Evento',
                    }
                  });
                }}
              >
                <Text style={styles.secondaryActionText}>
                  {selected.client_confirmed_at ? 'Ver estado de confirmación' : 'Confirmar realización evento'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dangerAction}
              onPress={handleCancelOrDelete}
            >
              <Text style={styles.dangerActionText}>
                {(() => {
                  if (!selected) return 'Cargando...';

                  if (selected.estado === 'completado') {
                    return 'Opciones del evento';
                  } else if (selected.estado === 'cancelado') {
                    return 'Eliminar evento';
                  } else {
                    return 'Cancelar evento';
                  }
                })()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismiss} onPress={closeOptions}>
              <Text style={styles.dismissText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavBar
        activeTab="eventos"
        onHomePress={() => router.push('/home-cliente')}
        onEventosPress={() => { }}
        onSearchPress={() => router.push('/chats-cliente')}
        onAlertasPress={() => router.push('/alertas-cliente')}
        onMasPress={() => router.push('/apartadomascliente')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  headerBar: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  listContent: { padding: 20, gap: 16 },
  card: {
    backgroundColor: '#191919',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardSub: { color: '#bbb', fontSize: 13, marginTop: 2 },
  badgeOk: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: '#22C55E', borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
  badgeText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  cardBodyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaLabel: { color: '#999', fontSize: 12, fontWeight: '600' },
  metaValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cardFooter: { marginTop: 10 },
  metaHint: { color: '#999', fontSize: 12 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#bbb', fontSize: 14, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalSub: { color: '#bbb', fontSize: 13, marginTop: 4, marginBottom: 12 },
  primaryAction: { backgroundColor: '#5B7EFF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  primaryActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryAction: { backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  secondaryActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  dangerAction: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.08)', marginBottom: 8 },
  dangerActionText: { color: '#ff4444', fontSize: 14, fontWeight: '700' },
  dismiss: { alignItems: 'center', paddingVertical: 10 },
  dismissText: { color: '#999', fontSize: 13 },
  badgeCancelled: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#ff6b6b', borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
  badgeTextCancelled: { color: '#ff6b6b', fontSize: 12, fontWeight: '700' },
  badgeFinalized: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6', borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
  badgeTextFinalized: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },
});
