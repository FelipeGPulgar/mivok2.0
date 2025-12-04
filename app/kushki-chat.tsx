import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSystemMessage } from '../lib/notification-functions';
import { getCurrentUser, supabase } from '../lib/supabase';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'system' | 'user';
    timestamp: Date;
    type?: 'text' | 'options' | 'input';
}

export default function KushkiChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [step, setStep] = useState(0);
    const [inputText, setInputText] = useState('');
    const [bankDetails, setBankDetails] = useState({
        bank: '',
        accountType: '',
        accountNumber: '',
    });
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Initial greeting
        addSystemMessage('Hola, soy el asistente virtual de KushkiPagos. 🤖');
        setTimeout(() => {
            addSystemMessage('Para procesar tu pago de manera segura, necesito que ingreses tus datos bancarios.');
            setTimeout(() => {
                addSystemMessage('Por favor, ingresa el nombre de tu Banco:');
                setStep(1);
            }, 1000);
        }, 1000);
    }, []);

    const addSystemMessage = (text: string) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text,
                sender: 'system',
                timestamp: new Date(),
            }]);
        }, 1500);
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
        }]);
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        const text = inputText.trim();
        addUserMessage(text);
        setInputText('');

        // Process input based on step
        if (step === 1) {
            setBankDetails(prev => ({ ...prev, bank: text }));
            addSystemMessage(`Gracias. Ahora ingresa el Tipo de Cuenta (Cta Cte, Vista, Ahorro):`);
            setStep(2);
        } else if (step === 2) {
            setBankDetails(prev => ({ ...prev, accountType: text }));
            addSystemMessage(`Perfecto. Por último, ingresa tu Número de Cuenta:`);
            setStep(3);
        } else if (step === 3) {
            setBankDetails(prev => ({ ...prev, accountNumber: text }));
            setStep(4); // Processing

            setTimeout(() => {
                addSystemMessage('🔄 Procesando datos de forma segura...');
                setTimeout(() => {
                    addSystemMessage('✅ Datos validados correctamente.');
                    setTimeout(() => {
                        addSystemMessage('⚠️ Por seguridad, este chat se autodestruirá en breve.');
                        setStep(5); // Show options
                    }, 1000);
                }, 2000);
            }, 1000);
        }
    };

    const handleClose = async () => {
        try {
            // Notify user that payment is ready
            const user = await getCurrentUser();
            if (user) {
                await createSystemMessage(
                    '00000000-0000-0000-0000-000000000000', // Kushki System ID
                    user.id,
                    '✅ Tu pago ya está listo y ha sido depositado en tu cuenta.'
                );
            }

            // Update payment status in DB (Robust: Create if missing)
            if (params.eventId) {
                console.log('🔄 Updating payment status for event:', params.eventId);

                // 1. Check if payment exists
                const { data: existingPayment, error: fetchError } = await supabase
                    .from('pagos')
                    .select('id')
                    .eq('event_id', params.eventId)
                    .maybeSingle();

                if (fetchError) console.error('Error checking payment existence:', fetchError);

                if (existingPayment) {
                    // 2a. Update existing
                    console.log('✅ Payment record found, updating to LIBERADO');
                    const { error } = await supabase
                        .from('pagos')
                        .update({ estado: 'LIBERADO' })
                        .eq('id', existingPayment.id);

                    if (error) console.error('❌ Error updating payment status:', error);
                } else {
                    // 2b. Create new record (Self-healing)
                    console.warn('⚠️ No payment record found, creating new one (Self-healing)');
                    const currentUser = await getCurrentUser();
                    const { error } = await supabase
                        .from('pagos')
                        .insert({
                            event_id: params.eventId,
                            dj_id: currentUser?.id,
                            monto: params.monto ? Number(params.monto) : 0,
                            estado: 'LIBERADO',
                            token: `kushki_manual_${Date.now()}`,
                            es_mock: true
                        });

                    if (error) console.error('❌ Error creating payment record:', error);
                    else console.log('✅ New payment record created and released');
                }
            }

            Alert.alert(
                'Chat finalizado',
                'Tus datos han sido procesados. El pago se reflejará en tu cuenta.',
                [{
                    text: 'OK',
                    onPress: () => router.replace('/home-dj')
                }]
            );
        } catch (e) {
            console.error('Error closing chat:', e);
            router.replace('/home-dj');
        }
    };

    const handleQuery = () => {
        addUserMessage('¿Cuándo veré mi dinero?');
        addSystemMessage('El pago se procesará lo antes posible, generalmente en 1 día hábil o menos. 🕒');
        // Show close button again or keep options open
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>KushkiPagos Seguro</Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.chatContainer}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => (
                    <View key={msg.id} style={[
                        styles.messageBubble,
                        msg.sender === 'user' ? styles.userBubble : styles.systemBubble
                    ]}>
                        <Text style={[
                            styles.messageText,
                            msg.sender === 'user' ? styles.userText : styles.systemText
                        ]}>{msg.text}</Text>
                        <Text style={styles.timestamp}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                ))}
                {isTyping && (
                    <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>Escribiendo...</Text>
                    </View>
                )}

                {step === 5 && (
                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.optionButton} onPress={handleClose}>
                            <Text style={styles.optionButtonText}>🔒 Cerrar y Borrar Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.optionButton, styles.secondaryOption]} onPress={handleQuery}>
                            <Text style={styles.secondaryOptionText}>¿Cuándo veré mi dinero?</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {step > 0 && step < 4 && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                    style={styles.inputContainer}
                >
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Escribe aquí..."
                        placeholderTextColor="#666"
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Text style={styles.sendButtonText}>Enviar</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        alignItems: 'center',
        backgroundColor: '#191919',
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    chatContainer: { flex: 1 },
    chatContent: { padding: 16, paddingBottom: 40 },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    systemBubble: {
        backgroundColor: '#2a2a2a',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: '#5B7EFF',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    messageText: { fontSize: 15, lineHeight: 22 },
    systemText: { color: '#fff' },
    userText: { color: '#fff' },
    timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, alignSelf: 'flex-end' },
    typingIndicator: { padding: 8, marginLeft: 8 },
    typingText: { color: '#666', fontStyle: 'italic', fontSize: 12 },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#191919',
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#fff',
        marginRight: 12,
    },
    sendButton: {
        backgroundColor: '#5B7EFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    sendButtonText: { color: '#fff', fontWeight: '700' },
    optionsContainer: { marginTop: 20, gap: 12 },
    optionButton: {
        backgroundColor: '#EF4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    optionButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    secondaryOption: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#5B7EFF',
    },
    secondaryOptionText: { color: '#5B7EFF', fontWeight: '700', fontSize: 16 },
});
