import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useRole } from '../lib/RoleContext';
import {
    ActivityIndicator,
    Alert,
    Modal, Platform, SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as proposalsFn from '../lib/proposals-functions';

// Las credenciales se cargan desde `secrets.local.ts` (no versionado). Si no existe,
// el flujo avisará para que pegues tu token de prueba.
let ACCESS_TOKEN = '';
try {
    // Import dinámico para que no rompa en CI si no existe el archivo
    // El archivo `secrets.local.ts` debe exportar: `export const MP_ACCESS_TOKEN = 'TEST-...';`
    // NOTA: este archivo debe añadirse al `.gitignore` (ya lo configuré).
    // Puedes editarlo localmente con tu token de prueba.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore
    const secrets = require('../secrets.local');
    ACCESS_TOKEN = secrets.MP_ACCESS_TOKEN || '';
} catch (e) {
    // no-op: si no existe, se informará más adelante
}

export default function PagoMercadoPagoScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { monto, nombreEvento, eventId } = params;
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [webviewVisible, setWebviewVisible] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const { isDJ, isLoading: roleLoading } = useRole();
    // Display values (fall back to params, or loaded proposal)
    const [displayMonto, setDisplayMonto] = useState<number | null>(monto ? Number(monto) : null);
    const [displayNombreEvento, setDisplayNombreEvento] = useState<string | null>(nombreEvento ? String(nombreEvento) : null);
    const [displayProposalDetails, setDisplayProposalDetails] = useState<any | null>(null);
    // Allow forcing the Pay button enabled for testing via local secrets (MP_FORCE_PAY = true)
    let forcePay = false;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        // @ts-ignore
        const _s = require('../secrets.local');
        forcePay = _s.MP_FORCE_PAY === true || _s.MP_FORCE_PAY === 'true';
    } catch (e) {
        // ignore
    }
    // Allow forcing role for testing: MP_FORCE_ROLE = 'client' | 'dj'
    let forceRole: string | null = null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        // @ts-ignore
        const _s2 = require('../secrets.local');
        if (_s2.MP_FORCE_ROLE) forceRole = String(_s2.MP_FORCE_ROLE).toLowerCase();
    } catch (e) {
        // ignore
    }

    // Compute effective role: respect any override, otherwise use role context
    const effectiveIsDJ = (() => {
        if (forceRole === 'client') return false;
        if (forceRole === 'dj') return true;
        // if roleLoading true and isDJ is null, assume client for better UX (so pay button shows)
        if (roleLoading || typeof isDJ === 'undefined' || isDJ === null) return false;
        return !!isDJ;
    })();
    const createPreference = async () => {
        console.log('🚀 Iniciando creación de preferencia...');
        try {
            // Use display values which may be loaded from proposal if params were missing
            const unitPrice = displayMonto !== null ? Number(displayMonto) : (monto ? Number(monto) : 1000);
            const title = displayNombreEvento || (nombreEvento ? String(nombreEvento) : 'Servicio Mivok (Pago Cliente)');

            console.log('📦 Datos:', { unitPrice, title });

            // Llamamos al microservicio local para crear la preference (más seguro)
            // El servidor usará MP_ACCESS_TOKEN en sus variables de entorno.
            // `MP_SERVER_URL` se define en `secrets.local.ts` si necesitas cambiar el host (emulador Android: 10.0.2.2)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            // @ts-ignore
            const localSecrets = require('../secrets.local');
            let serverUrl = localSecrets.MP_SERVER_URL || 'http://localhost:3000';
            console.log('🔧 Using MP server URL (raw):', localSecrets.MP_SERVER_URL);

            // Build candidate URLs to try (helps iOS simulator, Android emulator, physical devices)
            const candidates: string[] = [];
            candidates.push(serverUrl);
            if (serverUrl.includes('localhost')) {
                candidates.push(serverUrl.replace('localhost', '127.0.0.1'));
                // Android emulator mapping
                candidates.push(serverUrl.replace('localhost', '10.0.2.2'));
            }
            // Ensure unique
            const uniqueCandidates = Array.from(new Set(candidates));
            console.log('🔧 Candidate server URLs:', uniqueCandidates);

            const fetchWithTimeout = (url: string, opts: any, ms = 4000) => {
                return Promise.race([
                    fetch(url, opts),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
                ]);
            };

            let lastError: any = null;
            let response: Response | null = null;
            for (const candidate of uniqueCandidates) {
                try {
                    console.log('🔧 Trying candidate:', candidate);
                    response = (await fetchWithTimeout(`${candidate}/create_preference`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            items: [ { id: '1234', title: title, quantity: 1, currency_id: 'CLP', unit_price: unitPrice } ],
                            payer: { email: 'TESTUSER330557785022387793@testuser.com' },
                            binary_mode: false,
                            back_urls: { success: 'https://www.google.com', failure: 'https://www.google.com', pending: 'https://www.google.com' },
                            auto_return: 'approved'
                        })
                    }, 4000)) as Response;

                    if (response && (response.ok || response.status)) {
                        console.log('🔧 Candidate responded:', candidate, response.status);
                        serverUrl = candidate;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn('🔧 Candidate failed:', candidate, err && err.message ? err.message : err);
                }
            }

            if (!response) {
                console.error('Error: could not reach any MP server candidate', lastError);
                if (Platform.OS === 'ios' && Constants.isDevice && (localSecrets.MP_SERVER_URL || '').includes('localhost')) {
                    Alert.alert('Error de red', 'No se pudo conectar al servidor de pruebas. En iPhone físico no funciona "localhost" — actualiza `MP_SERVER_URL` en `secrets.local.ts` con la IP LAN de tu máquina (ej. http://192.168.1.84:3000).');
                } else {
                    Alert.alert('Error de red', 'No se pudo conectar al servidor de pruebas. Revisa que el servidor esté en ejecución y que el teléfono pueda alcanzarlo. Comprueba la IP/puerto en `secrets.local.ts`.');
                }
                return;
            }

            console.log('📡 Respuesta status:', response.status);
            const data = await response.json();
            console.log('📦 Respuesta data:', data);

                if (data.init_point) {
                // Preferimos sandbox_init_point si estamos en pruebas
                const url = data.sandbox_init_point || data.init_point;
                console.log('🔗 URL de checkout:', url);

                // Abrimos el checkout en un WebView modal dentro de la app para evitar
                // que el navegador del sistema reutilice cookies de la cuenta real.
                setCheckoutUrl(url);
                setWebviewVisible(true);

            } else {
                console.error('Error creating preference:', data);
                Alert.alert('Error', 'No se pudo iniciar el pago. Verifica el Access Token.');
            }
        } catch (error: any) {
            console.error('Error en createPreference:', error);
            const message = (error && error.message) ? error.message : String(error);
            if (message.includes('Network request failed')) {
                Alert.alert(
                    'Error de red',
                    'No se pudo conectar al servidor de pruebas. Si estás probando en un dispositivo físico, asegúrate de que `MP_SERVER_URL` en `secrets.local.ts` apunte a la IP de tu máquina (ej. http://192.168.1.20:3000). Si usas Android emulator, usa 10.0.2.2 en lugar de localhost.'
                );
            } else {
                Alert.alert('Error', 'Error de conexión con Mercado Pago. ' + message);
            }
        } finally {
            setLoading(false);
        }
    };

    // If params didn't include monto/nombreEvento but include eventId, try to load proposal details
    React.useEffect(() => {
        let mounted = true;
        const loadProposal = async () => {
            try {
                if ((!monto || !nombreEvento) && eventId) {
                    console.log('🔎 Cargando propuesta por eventId:', eventId);
                    const prop = await proposalsFn.getProposalById(String(eventId));
                    if (prop && mounted) {
                        console.log('✅ Propuesta cargada:', prop);
                        setDisplayMonto(prop.monto || Number(prop.monto_contraoferta) || null);
                        setDisplayNombreEvento(prop.detalles || `Evento ${prop.id}`);
                        setDisplayProposalDetails(prop);
                    }
                }
            } catch (e) {
                console.warn('⚠️ No se pudo cargar propuesta desde eventId:', e);
            }
        };
        loadProposal();
        return () => { mounted = false; };
    }, [eventId, monto, nombreEvento]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Confirmar Pago</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="information-circle-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Total a Pagar</Text>
                    <Text style={styles.price}>${displayMonto !== null ? Number(displayMonto).toLocaleString('es-CL') : '1.000'} CLP</Text>
                    <Text style={styles.note}>(Monto acordado)</Text>

                    <View style={styles.divider} />

                    <Text style={styles.description}>{displayNombreEvento || 'Servicio DJ'}</Text>
                    {displayProposalDetails ? (
                        <View style={{ marginTop: 12, width: '100%' }}>
                            {displayProposalDetails.horas && (
                                <Text style={{ color: '#bbb' }}>Duración: {displayProposalDetails.horas} horas</Text>
                            )}
                            {displayProposalDetails.fecha_evento && (
                                <Text style={{ color: '#bbb' }}>Fecha: {displayProposalDetails.fecha_evento}</Text>
                            )}
                            {displayProposalDetails.ubicacion_evento && (
                                <Text style={{ color: '#bbb' }}>Ubicación: {displayProposalDetails.ubicacion_evento}</Text>
                            )}
                        </View>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={[styles.payButton, (loading || roleLoading || (effectiveIsDJ && !forcePay) || displayMonto === null) ? { opacity: 0.6 } : null]}
                    onPress={createPreference}
                    disabled={loading || roleLoading || ((effectiveIsDJ && !forcePay) || displayMonto === null)}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Pagar con Mercado Pago</Text>
                            <Ionicons name="card-outline" size={24} color="#fff" style={{ marginLeft: 10 }} />
                        </>
                    )}
                </TouchableOpacity>

                {effectiveIsDJ ? (
                    <Text style={[styles.secureText, { color: '#f66', marginTop: 8 }]}>Los DJs no pueden pagar por servicios. Inicia sesión como cliente para realizar pagos.</Text>
                ) : null}

                <Text style={styles.secureText}>
                    <Ionicons name="lock-closed-outline" size={14} color="#888" /> Pago 100% seguro vía Web
                </Text>
            </View>

            {/* WebView modal para checkout (sandbox) - sesión más aislada que abrir el navegador del sistema */}
            <Modal
                animationType="slide"
                visible={webviewVisible}
                onRequestClose={() => {
                    setWebviewVisible(false);
                }}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                    <View style={{ height: 56, backgroundColor: '#121212', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                        <TouchableOpacity onPress={() => setWebviewVisible(false)} style={{ padding: 8 }}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={{ color: '#fff', marginLeft: 12, fontSize: 16 }}>Checkout Mercado Pago</Text>
                    </View>

                    {checkoutUrl ? (
                        <WebView
                            source={{ uri: checkoutUrl }}
                            startInLoadingState
                            javaScriptEnabled
                            cacheEnabled={false}
                            onNavigationStateChange={(navState) => {
                                // Detectamos cuando el flujo termina redirigiendo a los back_urls (ej. google.com en pruebas)
                                const url = navState.url || '';
                                if (url.includes('google.com')) {
                                    // Cerramos webview y preguntamos al usuario si completó el pago
                                    setWebviewVisible(false);
                                    Alert.alert(
                                        '¿Completaste el pago?',
                                        'Confirma si el pago fue exitoso para actualizar el estado.',
                                        [
                                            { text: 'No, cancelar', style: 'cancel' },
                                            {
                                                text: 'Sí, pago exitoso',
                                                onPress: () => {
                                                    Alert.alert('¡Pago Exitoso!', 'El servicio ha sido confirmado.', [
                                                        { text: 'Volver al Chat', onPress: () => router.back() }
                                                    ]);
                                                }
                                            }
                                        ]
                                    );
                                }
                            }}
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#fff' }}>Preparando checkout...</Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>

            {/* Modal de Datos de Prueba */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Datos de Prueba (Sandbox)</Text>

                        <View style={styles.cardInfo}>
                            <Text style={styles.cardLabel}>Tarjeta Visa:</Text>
                            <Text style={styles.cardValue}>4168 8188 4444 7115</Text>
                        </View>

                        <View style={styles.cardInfo}>
                            <Text style={styles.cardLabel}>Nombre:</Text>
                            <Text style={styles.cardValue}>APRO</Text>
                        </View>

                        <View style={styles.cardInfo}>
                            <Text style={styles.cardLabel}>Fecha / CVV:</Text>
                            <Text style={styles.cardValue}>11/30  |  123</Text>
                        </View>

                        <Text style={styles.modalNote}>
                            Usa estos datos exactos al pagar con tarjeta.
                        </Text>

                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeModalText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    label: {
        fontSize: 16,
        color: '#888',
        marginBottom: 10,
    },
    price: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    note: {
        fontSize: 14,
        color: '#666',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        width: '100%',
        marginVertical: 20,
    },
    description: {
        fontSize: 18,
        color: '#ccc',
        fontWeight: '500',
    },
    payButton: {
        backgroundColor: '#009EE3', // Mercado Pago Blue
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 30,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secureText: {
        color: '#888',
        fontSize: 12,
        marginTop: 10,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#222',
        borderRadius: 20,
        padding: 25,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    cardInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 10,
    },
    cardLabel: {
        color: '#aaa',
        fontSize: 16,
    },
    cardValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalNote: {
        color: '#FFD700',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    closeModalButton: {
        backgroundColor: '#333',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    closeModalText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
