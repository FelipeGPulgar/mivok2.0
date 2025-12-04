import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getPaymentsForDJ, Payment } from '../lib/supabase-functions';

export default function MisPagosDJScreen() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [releasedAmount, setReleasedAmount] = useState(0);
    const [retainedAmount, setRetainedAmount] = useState(0);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const data = await getPaymentsForDJ(user.id);
            setPayments(data);

            const total = data.reduce((sum, p) => sum + p.monto, 0);
            const released = data.filter(p => p.estado === 'LIBERADO').reduce((sum, p) => sum + p.monto, 0);
            const retained = data.filter(p => p.estado !== 'LIBERADO').reduce((sum, p) => sum + p.monto, 0);

            setTotalEarnings(total);
            setReleasedAmount(released);
            setRetainedAmount(retained);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCLP = (amount: number) => {
        return amount.toLocaleString('es-CL', {
            style: 'currency',
            currency: 'CLP',
        });
    };

    const renderPaymentItem = ({ item }: { item: Payment }) => {
        const clientName = item.client_profile
            ? `${item.client_profile.first_name} ${item.client_profile.last_name}`
            : 'Cliente';

        return (
            <View style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.eventName}>{item.events?.descripcion || 'Evento Mivok'}</Text>
                        <Text style={styles.clientName}>{clientName}</Text>
                        <Text style={styles.eventDate}>
                            {item.events?.fecha ? new Date(item.events.fecha).toLocaleDateString('es-CL') : 'Fecha desconocida'}
                        </Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        item.estado === 'LIBERADO' ? styles.statusLiberado : styles.statusRetenido
                    ]}>
                        <Text style={[
                            styles.statusText,
                            item.estado === 'LIBERADO' ? styles.textLiberado : styles.textRetenido
                        ]}>
                            {item.estado === 'LIBERADO' ? 'DEPOSITADO (Kushki)' : 'RETENIDO'}
                        </Text>
                    </View>
                </View>

                <View style={styles.paymentDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Monto:</Text>
                        <Text style={styles.amountText}>{formatCLP(item.monto)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Ubicación:</Text>
                        <Text style={styles.detailValue}>{item.events?.ubicacion || 'Ubicación no disponible'}</Text>
                    </View>
                </View>

                {item.estado === 'LIBERADO' && (
                    <View style={styles.confirmationContainer}>
                        <Text style={styles.confirmationTitle}>¿Recibiste el pago?</Text>
                        <View style={styles.confirmationButtons}>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={() => alert('¡Gracias por confirmar! El pago ha sido verificado.')}
                            >
                                <Text style={styles.confirmButtonText}>✅ Sí, recibido</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.reportButton}
                                onPress={() => alert('Se ha enviado un reporte a soporte. Te contactaremos pronto.')}
                            >
                                <Text style={styles.reportButtonText}>❌ No me llegó</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderChart = () => {
        if (totalEarnings === 0) return null;

        const releasedPercent = (releasedAmount / totalEarnings) * 100;
        const retainedPercent = (retainedAmount / totalEarnings) * 100;

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Resumen de Ganancias</Text>

                <View style={styles.chartContent}>
                    {/* Circular or Bar Representation */}
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${releasedPercent}%`, backgroundColor: '#10B981' }]} />
                        <View style={[styles.progressBarFill, { width: `${retainedPercent}%`, backgroundColor: '#FBBF24' }]} />
                    </View>

                    <View style={styles.legendContainer}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.legendText}>Liberado: {formatCLP(releasedAmount)}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
                            <Text style={styles.legendText}>Retenido: {formatCLP(retainedAmount)}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Pagos y Eventos</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={payments}
                renderItem={renderPaymentItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <>
                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Procesado</Text>
                            <Text style={styles.summaryAmount}>{formatCLP(totalEarnings)}</Text>
                            <Text style={styles.summarySubtext}>Histórico total</Text>
                        </View>
                        {/* Chart */}
                        {renderChart()}
                    </>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="wallet-outline" size={48} color="#666" />
                            <Text style={styles.emptyText}>No tienes pagos registrados aún.</Text>
                        </View>
                    ) : null
                }
            />

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#5B7EFF" />
                </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    summaryCard: {
        margin: 16,
        marginBottom: 8,
        padding: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    summaryLabel: {
        color: '#999',
        fontSize: 14,
        marginBottom: 8,
    },
    summaryAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summarySubtext: {
        color: '#666',
        fontSize: 12,
    },
    chartContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    chartTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    chartContent: {
        marginTop: 8,
    },
    progressBarContainer: {
        flexDirection: 'row',
        height: 24,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBarFill: {
        height: '100%',
    },
    legendContainer: {
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 20,
    },
    paymentCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    eventName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    clientName: {
        color: '#5B7EFF',
        fontSize: 14,
        marginBottom: 4,
    },
    eventDate: {
        color: '#999',
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    statusLiberado: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    statusRetenido: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    textLiberado: {
        color: '#10B981',
    },
    textRetenido: {
        color: '#FBBF24',
    },
    paymentDetails: {
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        color: '#666',
        fontSize: 14,
    },
    amountText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailValue: {
        color: '#ccc',
        fontSize: 14,
        maxWidth: '70%',
        textAlign: 'right',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(17, 17, 17, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmationContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    confirmationTitle: {
        color: '#999',
        fontSize: 12,
        marginBottom: 8,
    },
    confirmationButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    confirmButtonText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: 'bold',
    },
    reportButton: {
        flex: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    reportButtonText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
