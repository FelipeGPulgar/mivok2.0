import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getCurrentUser } from '../lib/supabase';
import { confirmPaymentEvent, getPaymentsForDJ, Payment } from '../lib/supabase-functions';

export default function BilleteraScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [saldoDisponible, setSaldoDisponible] = useState(0);
    const [saldoRetenido, setSaldoRetenido] = useState(0);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            const data = await getPaymentsForDJ(user.id);
            setPayments(data);

            // Calcular saldos
            let disponible = 0;
            let retenido = 0;

            data.forEach(p => {
                const monto = Number(p.monto) || 0;
                if (p.estado === 'LIBERADO') {
                    disponible += monto;
                } else if (p.estado === 'EN_ESCROW') {
                    retenido += monto;
                }
            });

            setSaldoDisponible(disponible);
            setSaldoRetenido(retenido);

        } catch (error) {
            console.error('Error cargando billetera:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleConfirmEvent = async (paymentId: string, amount: number) => {
        const commission = amount * 0.10;
        const netAmount = amount - commission;

        Alert.alert(
            'Confirmar Evento',
            `El evento se marcará como realizado.\n\nMonto Original: $${amount.toLocaleString('es-CL')}\nComisión Mivok (10%): -$${commission.toLocaleString('es-CL')}\n\nLiberarás: $${netAmount.toLocaleString('es-CL')}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, Confirmar',
                    onPress: async () => {
                        setLoading(true);
                        const success = await confirmPaymentEvent(paymentId);
                        if (success) {
                            Alert.alert('¡Éxito!', `Se han liberado $${netAmount.toLocaleString('es-CL')} a tu saldo.`);
                            loadData();
                        } else {
                            Alert.alert('Error', 'No se pudo confirmar el evento.');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Payment }) => {
        const isEscrow = item.estado === 'EN_ESCROW';
        const eventDate = item.events?.fecha ? new Date(item.events.fecha) : new Date();
        const today = new Date();
        // Permitir confirmar si la fecha del evento ya pasó o es hoy
        const canConfirm = isEscrow && (today >= eventDate || true); // For demo purposes always true

        return (
            <View style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={isEscrow ? "time-outline" : "checkmark-circle-outline"}
                            size={24}
                            color={isEscrow ? "#FCD34D" : "#4ade80"}
                        />
                    </View>
                    <View style={styles.transactionInfo}>
                        <Text style={styles.eventName}>{item.events?.descripcion || 'Evento Mivok'}</Text>
                        <Text style={styles.eventDate}>{item.events?.fecha || 'Fecha no disponible'}</Text>
                    </View>
                    <Text style={[styles.amount, { color: isEscrow ? '#FCD34D' : '#4ade80' }]}>
                        +${Number(item.monto).toLocaleString('es-CL')}
                    </Text>
                </View>

                {isEscrow && (
                    <View style={styles.actionContainer}>
                        <Text style={styles.escrowText}>
                            Fondos retenidos hasta confirmar el evento.
                        </Text>
                        {canConfirm && (
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={() => handleConfirmEvent(item.id, Number(item.monto))}
                            >
                                <Text style={styles.confirmButtonText}>Confirmar Realización</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Mi Billetera</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.balanceContainer}>
                <View style={[styles.balanceCard, { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ade80' }]}>
                    <Text style={styles.balanceLabel}>Saldo Disponible</Text>
                    <Text style={[styles.balanceValue, { color: '#4ade80' }]}>
                        ${saldoDisponible.toLocaleString('es-CL')}
                    </Text>
                </View>
                <View style={[styles.balanceCard, { backgroundColor: 'rgba(252, 211, 77, 0.1)', borderColor: '#FCD34D' }]}>
                    <Text style={styles.balanceLabel}>En Retención (Escrow)</Text>
                    <Text style={[styles.balanceValue, { color: '#FCD34D' }]}>
                        ${saldoRetenido.toLocaleString('es-CL')}
                    </Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Historial de Transacciones</Text>

            {loading ? (
                <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={payments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No hay transacciones registradas.</Text>
                    }
                />
            )}
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    balanceContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    balanceCard: {
        flex: 1,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    balanceLabel: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 5,
        fontWeight: '600',
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 10,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    transactionCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    transactionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    eventName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    eventDate: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    escrowText: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 10,
        fontStyle: 'italic',
    },
    confirmButton: {
        backgroundColor: '#4ade80',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
    }
});
