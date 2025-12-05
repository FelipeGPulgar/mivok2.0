import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { getUnpaidAcceptedProposals, Proposal } from '../lib/supabase-functions';

export default function PagarServiciosClienteScreen() {
    const router = useRouter();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalToPay, setTotalToPay] = useState(0);

    const loadProposals = useCallback(async () => {
        try {
            console.log('🔄 Cargando propuestas para pagar...');
            console.log('🕐 Timestamp:', new Date().toISOString());
            setLoading(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('❌ No hay usuario autenticado');
                return;
            }

            console.log('👤 Usuario ID para buscar propuestas:', user.id);
            console.log('📞 Llamando getUnpaidAcceptedProposals...');
            
            const data = await getUnpaidAcceptedProposals(user.id);
            
            console.log('📋 Resultado de getUnpaidAcceptedProposals:', {
                cantidad: data.length,
                propuestas: data.map(p => ({
                    id: p.id.slice(0, 8),
                    estado: p.estado,
                    monto: p.monto,
                    monto_con_comision: p.monto_con_comision,
                    client_id: p.client_id,
                    detalles: p.detalles
                }))
            });
            
            setProposals(data);

            // Usar monto_con_comision si está disponible, sino usar monto
            const total = data.reduce((sum, p) => sum + (p.monto_con_comision || p.monto), 0);
            setTotalToPay(total);
            
            console.log('💰 Total calculado:', total);
            console.log('✅ Propuestas cargadas:', data.length, 'Total:', total);
        } catch (error) {
            console.error('❌ Error en loadProposals:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar propuestas cuando la pantalla gane focus (regrese de chat)
    useFocusEffect(
        useCallback(() => {
            loadProposals();
        }, [loadProposals])
    );

    useEffect(() => {
        loadProposals();
    }, [loadProposals]);

    const formatCLP = (amount: number) => {
        return amount.toLocaleString('es-CL', {
            style: 'currency',
            currency: 'CLP',
        });
    };

    const handlePayProposal = (proposal: Proposal) => {
        router.push({
            pathname: '/pago-kushki-mock',
            params: {
                monto: proposal.monto_con_comision || proposal.monto,
                nombreEvento: proposal.detalles || 'Evento Mivok',
                proposalId: proposal.id,
                clientId: proposal.client_id,
                djId: proposal.dj_id,
            }
        });
    };

    const handlePayAll = () => {
        if (proposals.length === 0) return;

        // For now, since pago-kushki-mock handles one proposalId, we might need to adapt it.
        // But to fulfill the "pay all" request simply for now without refactoring the whole payment flow:
        // We can pass a comma-separated list of IDs if the mock supports it, or just pick the first one as "reference" 
        // but charge the full amount.
        // Ideally, we should create a "Bulk Payment" record.
        // Let's try passing the first ID as reference but the TOTAL amount.
        // And maybe a special flag 'isBulk=true' and 'proposalIds=id1,id2,id3'.

        const proposalIds = proposals.map(p => p.id).join(',');
        const djIds = [...new Set(proposals.map(p => p.dj_id))].join(','); // Unique DJs

        router.push({
            pathname: '/pago-kushki-mock',
            params: {
                monto: totalToPay,
                nombreEvento: `Pago de ${proposals.length} servicios`,
                proposalId: proposalIds, // Passing all IDs
                clientId: proposals[0].client_id,
                djId: djIds,
                isBulk: 'true'
            }
        });
    };

    const renderProposalItem = ({ item }: { item: Proposal }) => (
        <View style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
                <View>
                    <Text style={styles.eventName}>{item.detalles || 'Evento sin nombre'}</Text>
                    <Text style={styles.eventDate}>
                        {item.fecha_evento ? new Date(item.fecha_evento).toLocaleDateString('es-CL') : 'Fecha por definir'}
                    </Text>
                </View>
                <View style={styles.amountBadge}>
                    <Text style={styles.amountText}>{formatCLP(item.monto_con_comision || item.monto)}</Text>
                </View>
            </View>

            <View style={styles.proposalDetails}>
                <Text style={styles.detailText}>Duración: {item.horas_duracion} horas</Text>
                <Text style={styles.detailText}>Ubicación: {item.ubicacion_evento || 'No especificada'}</Text>
            </View>

            <TouchableOpacity
                style={styles.payButton}
                onPress={() => handlePayProposal(item)}
            >
                <Text style={styles.payButtonText}>Pagar este evento</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pagar Servicios</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total a Pagar</Text>
                <Text style={styles.summaryAmount}>{formatCLP(totalToPay)}</Text>
                <Text style={styles.summarySubtext}>{proposals.length} eventos pendientes de pago</Text>

                {proposals.length > 1 && (
                    <TouchableOpacity
                        style={styles.payAllButton}
                        onPress={handlePayAll}
                    >
                        <Text style={styles.payAllButtonText}>Pagar Todo ({formatCLP(totalToPay)})</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" color="#5B7EFF" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={proposals}
                    renderItem={renderProposalItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                            <Text style={styles.emptyText}>¡Estás al día! No tienes pagos pendientes.</Text>
                        </View>
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
        marginBottom: 16,
    },
    payAllButton: {
        backgroundColor: '#009EE3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    payAllButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    proposalCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    proposalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    eventName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    eventDate: {
        color: '#999',
        fontSize: 13,
    },
    amountBadge: {
        backgroundColor: '#222',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#333',
    },
    amountText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: 'bold',
    },
    proposalDetails: {
        gap: 4,
        marginBottom: 16,
    },
    detailText: {
        color: '#ccc',
        fontSize: 14,
    },
    payButton: {
        backgroundColor: 'rgba(0, 158, 227, 0.1)',
        borderWidth: 1,
        borderColor: '#009EE3',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    payButtonText: {
        color: '#009EE3',
        fontWeight: '600',
        fontSize: 14,
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
});
