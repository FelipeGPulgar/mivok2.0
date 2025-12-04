import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function PagoKushkiMockScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { monto, nombreEvento, proposalId, eventId, clientId, djId } = params;

    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const handlePay = async () => {
        if (!cardNumber || !cardName || !expiry || !cvv) {
            Alert.alert('Error', 'Por favor completa todos los campos de la tarjeta.');
            return;
        }

        setLoading(true);

        // Simular tiempo de procesamiento de Kushki
        setTimeout(async () => {
            try {
                const token = `kushki_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                const amount = monto ? Number(monto) : 0;

                console.log('✅ Token generado (Mock):', token);

                // Intentar guardar en Supabase (si la tabla 'pagos' existe)
                const { error } = await supabase.from('pagos').insert({
                    token: token,
                    monto: amount,
                    dj_id: djId || null,
                    client_id: clientId || null,
                    event_id: eventId || null,
                    proposal_id: proposalId || null,
                    estado: 'EN_ESCROW',
                    es_mock: true,
                    created_at: new Date().toISOString()
                });

                if (error) {
                    console.warn('⚠️ No se pudo guardar en la tabla "pagos". Asegúrate de crearla en Supabase.', error);
                    // No bloqueamos el flujo si falla el guardado, es una demo.
                } else {
                    console.log('💾 Pago guardado en base de datos.');
                }

                setLoading(false);

                Alert.alert(
                    '¡Pago Exitoso!',
                    `$${amount.toLocaleString('es-CL')} han sido retenidos en Escrow.\n\nSe liberarán al DJ cuando confirme el evento.`,
                    [
                        {
                            text: 'Entendido',
                            onPress: () => {
                                // Aquí podrías redirigir a una pantalla de éxito o volver al chat
                                router.back();
                            }
                        }
                    ]
                );

            } catch (err) {
                console.error('Error en proceso de pago:', err);
                setLoading(false);
                Alert.alert('Error', 'Ocurrió un error procesando el pago.');
            }
        }, 3000); // 3 segundos de delay simulado
    };

    // Formatear input de tarjeta
    const handleCardNumberChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        if (cleaned.length <= 16) setCardNumber(formatted);
    };

    // Formatear expiración
    const handleExpiryChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length >= 2) {
            setExpiry(cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4));
        } else {
            setExpiry(cleaned);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Kushki Secure Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total a Pagar</Text>
                        <Text style={styles.summaryPrice}>${monto ? Number(monto).toLocaleString('es-CL') : '0'}</Text>
                        <Text style={styles.summaryDesc}>{nombreEvento || 'Servicio DJ'}</Text>
                        <View style={styles.badge}>
                            <Ionicons name="shield-checkmark" size={14} color="#4ade80" />
                            <Text style={styles.badgeText}>Pago Seguro en Escrow</Text>
                        </View>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Datos de la Tarjeta</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Número de Tarjeta</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="card-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="0000 0000 0000 0000"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    value={cardNumber}
                                    onChangeText={handleCardNumberChange}
                                    maxLength={19}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre del Titular</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Como aparece en la tarjeta"
                                    placeholderTextColor="#666"
                                    value={cardName}
                                    onChangeText={setCardName}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Vencimiento</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="MM/YY"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    value={expiry}
                                    onChangeText={handleExpiryChange}
                                    maxLength={5}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.label}>CVV</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    value={cvv}
                                    onChangeText={(text) => setCvv(text.replace(/[^0-9]/g, '').slice(0, 4))}
                                    secureTextEntry
                                    maxLength={4}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.payButton, loading && styles.payButtonDisabled]}
                        onPress={handlePay}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.payButtonText}>Pagar ${monto ? Number(monto).toLocaleString('es-CL') : '0'}</Text>
                                <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Procesado por Kushki</Text>
                        <Text style={styles.footerSubtext}>Tus datos viajan encriptados</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    summaryCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#333',
    },
    summaryLabel: {
        color: '#888',
        fontSize: 14,
        marginBottom: 5,
    },
    summaryPrice: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryDesc: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 15,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '600',
    },
    formContainer: {
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        paddingVertical: 14,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    payButton: {
        backgroundColor: '#0057FF', // Kushki Blue-ish
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 14,
        shadowColor: "#0057FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    payButtonDisabled: {
        opacity: 0.7,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    footerSubtext: {
        color: '#444',
        fontSize: 12,
        marginTop: 4,
    }
});
