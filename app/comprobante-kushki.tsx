import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ComprobanteKushkiScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { monto, nombreEvento, fecha, token } = params;

    const handleShare = () => {
        Alert.alert('Compartir', 'Funcionalidad de compartir comprobante (Simulada)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comprobante de Pago</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Ionicons name="share-outline" size={24} color="#5B7EFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.ticketContainer}>
                    {/* Kushki Logo / Header */}
                    <View style={styles.ticketHeader}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="shield-checkmark" size={32} color="#fff" />
                        </View>
                        <Text style={styles.kushkiText}>KushkiPagos</Text>
                        <Text style={styles.successText}>Transacción Exitosa</Text>
                    </View>

                    {/* Amount */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>Monto Total</Text>
                        <Text style={styles.amountValue}>${Number(monto || 0).toLocaleString('es-CL')}</Text>
                    </View>

                    {/* Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Fecha</Text>
                            <Text style={styles.detailValue}>{fecha ? new Date(fecha as string).toLocaleDateString() : new Date().toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Evento</Text>
                            <Text style={styles.detailValue}>{nombreEvento || 'Servicio DJ'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>ID Transacción</Text>
                            <Text style={styles.detailValueID}>{token || `TX-${Date.now()}`}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Estado</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>LIBERADO</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.ticketFooter}>
                        <Text style={styles.footerText}>Este comprobante es válido como respaldo de tu pago.</Text>
                        <Text style={styles.footerSubtext}>KushkiPagos Secure Transaction</Text>
                    </View>
                </View>
            </ScrollView>
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
        paddingVertical: 16,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    shareButton: {
        padding: 8,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    ticketContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        paddingBottom: 20,
    },
    ticketHeader: {
        backgroundColor: '#0057FF',
        alignItems: 'center',
        paddingVertical: 30,
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    kushkiText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    successText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    amountContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginHorizontal: 20,
    },
    amountLabel: {
        color: '#666',
        fontSize: 14,
        marginBottom: 8,
    },
    amountValue: {
        color: '#000',
        fontSize: 36,
        fontWeight: 'bold',
    },
    detailsContainer: {
        padding: 20,
        gap: 16,
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
    detailValue: {
        color: '#000',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 20,
    },
    detailValueID: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'Courier',
    },
    statusBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#166534',
        fontSize: 12,
        fontWeight: 'bold',
    },
    ticketFooter: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    footerText: {
        color: '#999',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 4,
    },
    footerSubtext: {
        color: '#ccc',
        fontSize: 10,
    },
});
