import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as chatFunctions from '../lib/chat-functions';
import { formatCLP } from '../lib/formatters';
import * as notificationManager from '../lib/notifications';
import * as profileFunctions from '../lib/profile-functions';
import { useRole } from '../lib/RoleContext';
import { getCurrentUser, supabase } from '../lib/supabase';
import * as supabaseFunctions from '../lib/supabase-functions';

const { width } = Dimensions.get('window');

// Interfaces
interface Proposal {
  id: string;
  client_id?: string;
  dj_id?: string;
  monto: number;
  horas: number;
  detalles: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'contraoferta';
  timestamp: string;
  generos?: string[] | null;
}

interface Message {
  id: string;
  sender: 'usuario' | 'dj' | 'system';
  text?: string;
  timestamp: string;
  proposal?: Proposal;
  isProposal?: boolean;
  isSystemMessage?: boolean;
  isRead?: boolean;
  senderName?: string;  // 🔥 Nombre del remitente
  senderImage?: string; // 🔥 Foto del remitente
}

interface DJChat {
  id: string;
  nombre: string;
  ubicacion: string;
  imagen: string;
  estado: 'online' | 'offline';
  telefono?: string;
  ciudad?: string;
}

// Data
const DJS_CHAT_DATA: { [key: string]: DJChat } = {
  '1': {
    id: '1',
    nombre: 'DJ Alex Rivera',
    ubicacion: 'Santiago, Metropolitana',
    imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
    estado: 'online',
    telefono: '+56 9 8765 4321',
    ciudad: 'Santiago',
  },
  '2': {
    id: '2',
    nombre: 'DJ Luna Martinez',
    ubicacion: 'Valparaíso, Valparaíso',
    imagen: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop',
    estado: 'online',
    telefono: '+56 9 8765 4322',
    ciudad: 'Valparaíso',
  },
  '3': {
    id: '3',
    nombre: 'DJ Carlos Lopez',
    ubicacion: 'Concepción, Biobío',
    imagen: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=100&h=100&fit=crop',
    estado: 'offline',
    telefono: '+56 9 8765 4323',
    ciudad: 'Concepción',
  },
  '4': {
    id: '4',
    nombre: 'DJ Sofia Fernandez',
    ubicacion: 'La Serena, Coquimbo',
    imagen: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=100&h=100&fit=crop',
    estado: 'online',
    telefono: '+56 9 8765 4324',
    ciudad: 'La Serena',
  },
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'dj',
    text: '¡Hola! Gracias por tu interés. ¿En qué puedo ayudarte con tu evento?',
    timestamp: '01:37 p.m.',
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isDJ, currentMode } = useRole();
  
  // Aceptar tanto userId como djId por compatibilidad
  const userId = params.userId as string || params.djId as string;
  const userName = params.userName as string || params.djName as string;
  
  // Log inicial de parámetros y modo
  useEffect(() => {
    console.log('📋 Parámetros del chat:', { userId, userName, params });
    console.log('🎭 Modo actual del usuario en chat:', { isDJ, currentMode });
  }, [userId, userName, params, isDJ, currentMode]);

  // Función para verificar qué propuestas ya fueron pagadas
  const checkPaidProposals = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const { data: payments } = await supabase
        .from('pagos')
        .select('proposal_id')
        .eq('client_id', currentUser.id);
      
      if (payments) {
        const paidIds = new Set(payments.map(p => p.proposal_id));
        setPaidProposals(paidIds);
        console.log('💳 Propuestas pagadas encontradas:', paidIds.size);
      }
    } catch (error) {
      console.error('Error checking paid proposals:', error);
    }
  }, [currentUser]);

  // Verificar pagos cuando cambie el usuario
  useEffect(() => {
    if (currentUser) {
      checkPaidProposals();
    }
  }, [currentUser, checkPaidProposals]);

  // Actualizar pagos cuando regrese de la pantalla de pago
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        checkPaidProposals();
      }
    }, [currentUser, checkPaidProposals])
  );

  // Estado
  const [dj, setDj] = useState<DJChat | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [monto, setMonto] = useState('');
  const [horas, setHoras] = useState('4');
  const [detalles, setDetalles] = useState('');

  // Date/Time Picker States
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  const [generos, setGeneros] = useState(''); // comma-separated genres
  const [ubicacion, setUbicacion] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);  // 🔥 Datos del usuario actual
  const [showMenu, setShowMenu] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<'pending' | 'approved' | 'rejected' | 'counter' | null>(null);
  const [paidProposals, setPaidProposals] = useState<Set<string>>(new Set()); // Track paid proposals
  const flatListRef = useRef<FlatList>(null);

  // Cargar usuario actual, DJ info y mensajes con suscripción en tiempo real
  useEffect(() => {
    let unsubscribeChat: (() => void) | null = null;
    let unsubscribeReadStatus: any = null;

    const loadData = async () => {
      try {
        // 🔔 Configurar handler de notificaciones y registrarse para push notifications
        notificationManager.setupNotificationHandler();

        // Registrarse para recibir push notifications
        const pushToken = await notificationManager.registerForPushNotificationsAsync();
        if (pushToken) {
          console.log('✅ Push notifications registradas con token:', pushToken);
        }

        // Cargar usuario actual
        let user = null;
        try {
          user = await getCurrentUser();
          setCurrentUser(user);

          // 🔥 CARGAR DATOS DEL USUARIO ACTUAL CON FALLBACKS
          if (user) {
            const userData = await profileFunctions.loadUserDataWithFallbacks();
            console.log('✅ Datos del usuario actual cargados con fallbacks:', userData.name);
            setCurrentUserProfile({
              name: userData.name,
              image: userData.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            });
          }
        } catch (authError) {
          console.warn('⚠️ No se pudo obtener sesión de usuario:', authError);
          // Continuar de todas formas, solo sin los datos del usuario actual
        }

        if (!userId) return;

        // Cargar info del usuario (DJ o cliente) desde Supabase - USAR LA MISMA FUNCIÓN QUE EN HOME
        try {
          console.log('🔄 Cargando perfil del usuario con ID:', userId);

          // Usar la misma función que se usa en home-dj.tsx: getUserProfileById
          const userProfile = await profileFunctions.getUserProfileById(userId);

          if (userProfile) {
            console.log('📦 Perfil de usuario cargado:', {
              nombre: userProfile.first_name,
              foto_url: userProfile.foto_url,
              email: userProfile.email
            });

            const djData: DJChat = {
              id: userId,
              nombre: userProfile.first_name || userName || 'DJ',
              ubicacion: 'Sin ubicación',
              imagen: userProfile.foto_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
              estado: 'online',
              telefono: userProfile.telefono || '+56 9 XXXX XXXX',
              ciudad: userProfile.ciudad || 'Chile',
            };

            console.log('✅ DJ/Usuario configurado desde user_profiles:', {
              nombre: djData.nombre,
              imagen: djData.imagen
            });
            setDj(djData);
          } else {
            // Fallback: usar solo el parámetro userName
            console.warn('⚠️ No se encontró perfil en user_profiles, usando parámetro userName:', userName);
            const fallbackDJ: DJChat = {
              id: userId,
              nombre: userName || 'DJ',
              ubicacion: 'Sin ubicación',
              imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
              estado: 'online',
              telefono: '+56 9 XXXX XXXX',
              ciudad: 'Chile',
            };
            setDj(fallbackDJ);
          }
        } catch (error) {
          console.error('❌ Error al cargar perfil del usuario:', error);
          // Crear DJ básico con el nombre que recibimos en parámetros como último recurso
          const basicDJ: DJChat = {
            id: userId,
            nombre: userName || 'DJ',
            ubicacion: 'Sin ubicación',
            imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
            estado: 'online',
            telefono: '+56 9 XXXX XXXX',
            ciudad: 'Chile',
          };
          console.log('✅ DJ fallback configurado:', basicDJ.nombre);
          setDj(basicDJ);
        }

        // Cargar mensajes históricos desde Supabase
        if (user) {
          console.log('📝 Cargando historial de mensajes...');
          const conversation = await chatFunctions.getConversation(user.id, userId, 50);
          if (conversation && conversation.length > 0) {
            console.log(`✅ Se cargaron ${conversation.length} mensajes`);
            // Convertir mensajes de Supabase a formato de UI
            const convertedMessages: Message[] = conversation.map((msg: any) => {
              console.log('📨 Procesando mensaje:', { content: msg.content, isRead: msg.is_read, sender: msg.sender_id });

              const isUserMessage = msg.sender_id === user.id;

              // 🔥 Cargar nombre e imagen del remitente
              let senderName = 'Usuario';
              let senderImage = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

              if (isUserMessage && currentUserProfile) {
                // Es mensaje del usuario actual
                senderName = currentUserProfile.name || 'Usuario';
                senderImage = currentUserProfile.image;
              } else if (!isUserMessage && dj) {
                // Es mensaje del DJ
                senderName = dj.nombre;
                senderImage = dj.imagen;
              }

              // Procesar proposal - asegurar que tenga ID
              let proposal = msg.metadata?.proposal;
              if (proposal && !proposal.id) {
                proposal = { ...proposal, id: msg.id };
                console.log('⚠️ Propuesta sin ID, asignando ID del mensaje:', msg.id);
              }

              return {
                id: msg.id,
                sender: isUserMessage ? 'usuario' : 'dj',
                // Mostrar el texto para mensajes normales y también para respuestas de propuesta
                text: (msg.content_type === 'text' || msg.metadata?.isProposalResponse) ? msg.content : undefined,
                timestamp: new Date(msg.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }),
                senderName,        // 🔥 Nombre del remitente
                senderImage,        // 🔥 Foto del remitente
                proposal: proposal,
                isProposal: msg.metadata?.isProposal,
                isRead: msg.is_read,
              };
            });
            setMessages(convertedMessages);
          }

          // Marcar todos los mensajes como leídos
          await chatFunctions.markConversationAsRead(user.id, userId);
          console.log('✅ Marcados como leídos');
        } else {
          console.warn('⚠️ No hay sesión de usuario, no se pueden cargar mensajes');
        }

        // SUSCRIBIRSE A MENSAJES EN TIEMPO REAL (solo si tenemos sesión)
        if (user) {
          console.log('🔄 Iniciando suscripción en tiempo real...');
          unsubscribeChat = chatFunctions.subscribeToConversation(
            user.id,
            userId,
            (newMessage: any) => {
              try {
                console.log('📥 Callback de nuevo mensaje disparado:', {
                  id: newMessage?.id,
                  sender: newMessage?.sender_id,
                  receiver: newMessage?.receiver_id,
                  content: newMessage?.content?.substring(0, 50),
                });

                if (!newMessage || !newMessage.id) {
                  console.warn('⚠️ Mensaje inválido recibido');
                  return;
                }

                // Convertir mensaje a formato UI
                // Procesar proposal - asegurar que tenga ID
                let proposal = newMessage.metadata?.proposal;
                if (proposal && !proposal.id) {
                  proposal = { ...proposal, id: newMessage.id };
                  console.log('⚠️ Propuesta sin ID, asignando ID del mensaje:', newMessage.id);
                }

                const isUserMessage = newMessage.sender_id === user.id;

                // 🔥 Cargar nombre e imagen del remitente para mensajes en tiempo real
                let senderName = 'Usuario';
                let senderImage = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

                if (isUserMessage && currentUserProfile) {
                  senderName = currentUserProfile.name || 'Usuario';
                  senderImage = currentUserProfile.image;
                } else if (!isUserMessage && dj) {
                  senderName = dj.nombre;
                  senderImage = dj.imagen;
                }

                const messageToAdd: Message = {
                  id: newMessage.id,
                  sender: isUserMessage ? 'usuario' : 'dj',
                  // Incluir texto cuando sea respuesta de propuesta para evitar burbuja vacía
                  text: (newMessage.content_type === 'text' || newMessage.metadata?.isProposalResponse) ? newMessage.content : undefined,
                  timestamp: new Date(newMessage.created_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }),
                  senderName,        // 🔥 Nombre del remitente
                  senderImage,        // 🔥 Foto del remitente
                  proposal: proposal,
                  isProposal: newMessage.metadata?.isProposal,
                  isRead: newMessage.is_read,
                };

                console.log('📨 Añadiendo mensaje a estado:', messageToAdd.id);

                // Agregar a la lista si no existe ya
                setMessages(prev => {
                  const exists = prev.some(m => m.id === messageToAdd.id);
                  if (!exists) {
                    console.log('✅ Mensaje nuevo, añadiendo. Total:', prev.length + 1);

                    // 🔔 ENVIAR NOTIFICACIÓN SI ES DE OTRO USUARIO
                    if (messageToAdd.sender === 'dj' && dj) {
                      // Determinar el tipo de notificación
                      if (newMessage.metadata?.isProposal) {
                        // Notificación de propuesta
                        const proposal = newMessage.metadata.proposal;
                        notificationManager.sendProposalNotification(
                          dj.nombre,
                          proposal?.monto || 0,
                          proposal?.horas || 0,
                          messageToAdd.id
                        );
                      } else if (newMessage.metadata?.isProposalResponse) {
                        // Notificación de respuesta a propuesta
                        notificationManager.sendProposalResponseNotification(
                          dj.nombre,
                          newMessage.metadata.proposal?.estado,
                          messageToAdd.id
                        );
                      } else if (messageToAdd.text) {
                        // Notificación de mensaje de texto
                        notificationManager.sendMessageNotification(
                          dj.nombre,
                          messageToAdd.text,
                          messageToAdd.id
                        );
                      }
                    }

                    // Si es una respuesta a propuesta, agregar también un mensaje de sistema
                    let newMessages = [...prev, messageToAdd];

                    if (newMessage.metadata?.isProposalResponse) {
                      console.log('🔔 Respuesta a propuesta detectada:', newMessage.metadata.proposal?.estado);

                      const estado = newMessage.metadata.proposal?.estado;
                      let statusText = '';

                      if (estado === 'aceptada') {
                        statusText = '✅ Propuesta aceptada';
                      } else if (estado === 'rechazada') {
                        statusText = '❌ Propuesta rechazada';
                      } else if (estado === 'contraoferta') {
                        statusText = '🔄 Contrapropuesta enviada';
                      }

                      if (statusText) {
                        const systemMessage: Message = {
                          id: `system_${Date.now()}`,
                          sender: 'system',
                          text: statusText,
                          timestamp: new Date().toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          }),
                          isSystemMessage: true,
                        };

                        newMessages = [...newMessages, systemMessage];
                        console.log('🔔 Mensaje de sistema agregado:', statusText);
                      }
                    }

                    return newMessages;
                  } else {
                    console.log('⚠️ Mensaje duplicado, ignorando');
                    return prev;
                  }
                });

                // Si el mensaje es para nosotros, marcarlo como leído
                if (newMessage.receiver_id === user.id) {
                  console.log('👁️ Marcando mensaje como leído:', newMessage.id);
                  chatFunctions.markMessageAsRead(newMessage.id).catch(e =>
                    console.error('❌ Error marcando como leído:', e)
                  );
                }

                // Hacer scroll automático al final
                setTimeout(() => {
                  console.log('⬇️ Haciendo scroll al final');
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              } catch (error) {
                console.error('❌ Error en callback de nuevo mensaje:', error);
              }
            },
            // Callback para actualización de mensajes (cuando se actualiza el estado de una propuesta)
            (messageId: string, updatedData: any) => {
              console.log('🔄 Actualización de mensaje recibida:', messageId, updatedData);

              // Actualizar el mensaje en la lista con la propuesta actualizada
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === messageId && updatedData.proposal
                    ? { ...msg, proposal: updatedData.proposal }
                    : msg
                )
              );
            }
          );

          // SUSCRIBIRSE A CAMBIOS DE LECTURA DE MENSAJES
          unsubscribeReadStatus = chatFunctions.subscribeToMessageUpdates(
            user.id,
            (updatedMessage: any) => {
              console.log('👁️ Mensaje marcado como leído:', updatedMessage.id);

              // Actualizar el estado de lectura en la UI
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === updatedMessage.id
                    ? { ...msg, isRead: updatedMessage.is_read }
                    : msg
                )
              );
            }
          );

          console.log('✅ Suscripción iniciada correctamente');
        } else {
          console.warn('⚠️ No se puede suscribirse a mensajes sin sesión de usuario');
        }
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
      }
    };

    loadData();

    // Limpiar suscripción al desmontar
    return () => {
      if (unsubscribeChat) {
        console.log('🔌 Desuscribiendo de mensajes...');
        unsubscribeChat();
      }
      if (unsubscribeReadStatus) {
        console.log('🔌 Desuscribiendo de cambios de lectura...');
        unsubscribeReadStatus();
      }
    };
  }, [userId, userName]);

  // Handlers
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !currentUser) return;

    try {
      console.log('📤 Enviando mensaje...', inputText);

      // Limpiar input INMEDIATAMENTE para mejor UX
      const messageToSend = inputText;
      setInputText('');

      // Enviar mensaje a Supabase usando chat-functions
      const sentMessage = await chatFunctions.sendMessage(
        currentUser.id,
        userId,
        messageToSend,
        'text'
      );

      if (sentMessage) {
        console.log('✅ Mensaje enviado:', sentMessage.id);
      } else {
        throw new Error('No se obtuvo respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  }, [inputText, currentUser, userId]);

  const handleSendProposal = useCallback(async () => {
    if (!monto || !horas || !currentUser) {
      Alert.alert('Error', 'Por favor completa monto y duración');
      return;
    }

    // Ubicación obligatoria
    if (!ubicacion || ubicacion.trim() === '') {
      Alert.alert('Error', 'La ubicación del evento es obligatoria.');
      return;
    }

    // --- VALIDACIÓN DE FECHA Y HORA ---
    const now = new Date();

    // 1. Validar que la fecha no sea pasada (comparando día)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Alert.alert('Fecha inválida', 'No puedes agendar eventos en fechas pasadas.');
      return;
    }

    // 2. Validar regla de 1 hora de anticipación si es hoy
    const eventStartDateTime = new Date(date);
    eventStartDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    if (eventStartDateTime < oneHourFromNow) {
      Alert.alert(
        'Hora inválida',
        'Debes agendar con al menos 1 hora de anticipación para dar tiempo al DJ de prepararse.'
      );
      return;
    }

    // 3. Calcular Hora Fin automáticamente (Start Time + Duration)
    const durationHours = parseInt(horas);
    const eventEndDateTime = new Date(eventStartDateTime);
    eventEndDateTime.setHours(eventEndDateTime.getHours() + durationHours);

    // Formatear strings para DB/Mensaje
    const fechaStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaInicioStr = startTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const horaFinStr = eventEndDateTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });

    try {
      console.log('💰 Enviando propuesta...');

      const montoSinComision = parseFloat(monto);
      const porcentajeComision = 0.10; // 10% como decimal (0.10)
      const montoComision = Math.round(montoSinComision * porcentajeComision);
      const montoConComision = Math.round(montoSinComision + montoComision);

      console.log('🔍 DEBUG - Valores calculados:', {
        monto: monto,
        montoSinComision: montoSinComision,
        porcentajeComision: porcentajeComision,
        montoComision: montoComision,
        montoConComision: montoConComision,
        horas: horas,
        horasParsed: parseInt(horas)
      });

      const proposalPayload: any = {
        monto: montoConComision, // Para compatibilidad, usar el monto total
        monto_sin_comision: montoSinComision, // Lo que recibe el DJ
        porcentaje_comision: porcentajeComision,
        monto_comision: montoComision,
        monto_con_comision: montoConComision, // Total que paga el cliente
        horas_duracion: parseInt(horas),
        detalles: detalles || null,
        fecha_evento: fechaStr,
        ubicacion_evento: ubicacion || null,
        generos_solicitados: generos ? generos.split(',').map(g => g.trim()).filter(Boolean) : null,
      };

      // 🔥 CORREGIDO: Identificar correctamente cliente y DJ usando currentMode
      console.log('🔍 DEBUG - Antes de crear propuesta:', {
        currentUserId: currentUser.id,
        userId: userId,
        isDJ: isDJ,
        currentMode: currentMode,
        userName: userName
      });
      
      // Usar currentMode directamente para determinar roles
      const isModeoDJ = currentMode === 'dj';
      const clientId = isModeoDJ ? userId : currentUser.id;  // Si estoy en modo DJ, el cliente es userId; si soy cliente, soy yo
      const djId = isModeoDJ ? currentUser.id : userId;      // Si estoy en modo DJ, soy yo; si soy cliente, el DJ es userId

      console.log('🔍 DEBUG - IDs calculados:', {
        clientId,
        djId,
        razonamiento: isModeoDJ ? 'Estoy en modo DJ, entonces userId es cliente' : 'Estoy en modo cliente, entonces userId es DJ',
        verificarDatos: {
          'Mi ID': currentUser.id,
          'Usuario chat': userId,
          'isDJ (deprecado)': isDJ,
          'currentMode': currentMode,
          'isModeoDJ': isModeoDJ
        }
      });

      const createdProposal = await supabaseFunctions.createProposal(
        clientId,
        djId,
        proposalPayload
      );

      if (!createdProposal) {
        throw new Error('No se pudo crear la propuesta en la base de datos');
      }

      console.log('✅ Propuesta persistida en DB con id:', createdProposal.id);
      console.log('🔍 IDs correctos - Cliente:', clientId, 'DJ:', djId, 'Soy DJ:', isDJ);

      // 2) Enviar la propuesta como mensaje con metadata
      const proposalDataForMessage = {
        id: createdProposal.id,
        client_id: clientId, // 🔥 CORREGIDO: Usar el cliente real
        dj_id: djId,         // 🔥 CORREGIDO: Usar el DJ real
        monto: createdProposal.monto,
        horas: createdProposal.horas_duracion || parseInt(horas),
        detalles: createdProposal.detalles || detalles || 'Sin detalles adicionales',
        fecha_evento: createdProposal.fecha_evento || fechaStr,
        hora_inicio: horaInicioStr,
        hora_fin: horaFinStr,
        ubicacion: createdProposal.ubicacion_evento || ubicacion || null,
        generos: createdProposal.generos_solicitados || (generos ? generos.split(',').map(g => g.trim()).filter(Boolean) : null),
        estado: createdProposal.estado || 'pendiente',
        timestamp: new Date().toISOString(),
      };

      const sentMessage = await chatFunctions.sendMessage(
        currentUser.id,
        userId,
        JSON.stringify(proposalDataForMessage),
        'proposal',
        { proposal: proposalDataForMessage, isProposal: true }
      );

      if (sentMessage) {
        console.log('✅ Propuesta enviada correctamente como mensaje');

        // Limpiar form
        setShowProposalModal(false);
        setMonto('');
        setHoras('4');
        setDetalles('');
        // Reset dates to now/defaults
        setDate(new Date());
        setStartTime(new Date());

        setUbicacion('');
        setGeneros('');
        setProposalStatus(null);

        Alert.alert('Éxito', currentMode === 'dj' ? 'Propuesta enviada al cliente' : 'Propuesta enviada al DJ');
      } else {
        throw new Error('No se pudo enviar la propuesta');
      }
    } catch (error) {
      console.error('❌ Error al enviar propuesta:', error);
      Alert.alert('Error', 'No se pudo enviar la propuesta. Intenta de nuevo.');
    }
  }, [monto, horas, detalles, date, startTime, ubicacion, generos, currentUser, userId]);

  // Handlers para responder a propuestas
  const handleAcceptProposal = useCallback(async (proposal: Proposal, originalMessageId?: string) => {
    if (!currentUser) return;

    try {
      console.log('✅ Aceptando propuesta...');
      setProposalStatus('approved');

      // Actualizar el estado de la propuesta en el mensaje
      setMessages(prev =>
        prev.map(msg =>
          msg.proposal?.id === proposal.id
            ? { ...msg, proposal: { ...msg.proposal, estado: 'aceptada' } }
            : msg
        )
      );

      const targetMessageId = originalMessageId || proposal.id;
      const sentMessage = await chatFunctions.respondToProposal(
        currentUser.id,
        userId,
        { estado: 'aceptada' },
        targetMessageId
      );

      if (sentMessage) {
        // Solo mostrar alerta de pago si el usuario actual es CLIENTE (no DJ)
        // El DJ no paga, solo recibe el pago cuando se completa el evento
        if (!isDJ) {
          // Esperar un momento para que se cree el evento en la BD
          setTimeout(() => {
            Alert.alert(
              '✅ Propuesta aceptada',
              'El evento ha sido agendado. Ahora debes realizar el pago para confirmar la reserva.',
              [
                {
                  text: 'Ir a Pagar',
                  onPress: () => {
                    console.log('💳 Redirigiendo a pantalla de pago (Kushki Mock)...');
                    router.push({
                      pathname: '/pago-kushki-mock',
                      params: {
                        monto: proposal.monto,
                        nombreEvento: proposal.detalles || 'Evento Mivok',
                        proposalId: proposal.id,
                        clientId: currentUser.id,
                        djId: userId,
                      }
                    });
                  },
                },
                { text: 'Pagar después', style: 'cancel' }
              ]
            );
          }, 500);
        } else {
          // Si es DJ, solo confirmar que aceptó
          Alert.alert(
            '✅ Propuesta aceptada',
            'El evento ha sido agendado. El cliente realizará el pago para confirmar la reserva.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ Error aceptando propuesta:', error);
      setProposalStatus(null);
      Alert.alert('Error', 'No se pudo aceptar la propuesta');
    }
  }, [currentUser, userId, isDJ]);

  const handleRejectProposal = useCallback(async (proposal: Proposal, originalMessageId?: string) => {
    if (!currentUser) return;

    try {
      console.log('❌ Rechazando propuesta...');
      setProposalStatus('rejected');

      // Actualizar el estado de la propuesta en el mensaje
      setMessages(prev =>
        prev.map(msg =>
          msg.proposal?.id === proposal.id
            ? { ...msg, proposal: { ...msg.proposal, estado: 'rechazada' } }
            : msg
        )
      );

      const targetMessageId = originalMessageId || proposal.id;
      const sentMessage = await chatFunctions.respondToProposal(
        currentUser.id,
        userId,
        { estado: 'rechazada' },
        targetMessageId
      );

      if (sentMessage) {
        Alert.alert('Propuesta rechazada', 'La propuesta ha sido rechazada.');
      }
    } catch (error) {
      console.error('❌ Error rechazando propuesta:', error);
      setProposalStatus(null);
      Alert.alert('Error', 'No se pudo rechazar la propuesta');
    }
  }, [currentUser, userId]);

  const handleCounterproposal = useCallback(async (originalProposal: Proposal, originalMessageId?: string) => {
    // Actualizar el estado de la propuesta original a contraoferta
    setMessages(prev =>
      prev.map(msg =>
        msg.proposal?.id === originalProposal.id
          ? { ...msg, proposal: { ...msg.proposal, estado: 'contraoferta' } }
          : msg
      )
    );

    setShowProposalModal(true);
    setProposalStatus('counter');
    setMonto(originalProposal.monto.toString());
    setHoras(originalProposal.horas.toString());
    setDetalles(`Contrapropuesta: ${originalProposal.detalles || 'Sin detalles adicionales'}`);
    // store which message we're countering (optional)
    if (originalMessageId) {
      console.log('🔁 Iniciando contrapropuesta para mensaje:', originalMessageId);
    }
  }, []);

  // Render proposal card
  const renderProposalCard = (proposal: Proposal, isUserMessage: boolean, messageId?: string) => {
    const statusColors: { [key: string]: string } = {
      pendiente: '#FFB800',
      contraoferta: '#5B7EFF',
      aceptada: '#10B981',
      rechazada: '#EF4444',
    };

    const statusLabels: { [key: string]: string } = {
      pendiente: '💰 Enviada esperando respuesta',
      contraoferta: '🔄 Contrapropuesta del DJ',
      aceptada: '✅ Propuesta aceptada',
      rechazada: '❌ Propuesta rechazada',
    };

    return (
      <View style={styles.proposalContainer}>
        <View style={[
          styles.proposalCard,
          {
            borderLeftColor: statusColors[proposal.estado],
            backgroundColor:
              proposal.estado === 'aceptada' ? 'rgba(16, 185, 129, 0.15)' :
                proposal.estado === 'rechazada' ? 'rgba(239, 68, 68, 0.15)' :
                  proposal.estado === 'contraoferta' ? 'rgba(251, 191, 36, 0.15)' :
                    '#1a1a1a'
          }
        ]}>
          <View style={styles.proposalHeader}>
            <Text style={styles.proposalTitle}>
              {isUserMessage ? 'Tu propuesta' : 'Propuesta del DJ'}
            </Text>
            <Text style={[styles.proposalStatus, { color: statusColors[proposal.estado] }]}>
              {statusLabels[proposal.estado]}
            </Text>
          </View>

          <View style={styles.proposalDetails}>
            <View style={styles.proposalDetailRow}>
              <Text style={styles.proposalLabel}>Monto:</Text>
              <Text style={styles.proposalAmount}>{formatCLP(proposal.monto)}</Text>
            </View>
            <View style={styles.proposalDetailRow}>
              <Text style={styles.proposalLabel}>Duración:</Text>
              <Text style={styles.proposalValue}>{proposal.horas} horas</Text>
            </View>
            {proposal.detalles && (
              <View style={styles.proposalDetailRow}>
                <Text style={styles.proposalLabel}>Detalles:</Text>
                <Text style={styles.proposalValue}>{proposal.detalles}</Text>
              </View>
            )}
          </View>

          {/* Solo mostrar botones si sí eres el receptor (no eres quien la envió) y está pendiente */}
          {!isUserMessage && proposal.estado === 'pendiente' && (
            <View style={styles.proposalActions}>
              <TouchableOpacity
                style={[styles.proposalButton, styles.acceptButton]}
                onPress={() => handleAcceptProposal(proposal, messageId)}
              >
                <Text style={styles.acceptButtonText}>✅ Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.proposalButton, styles.rejectButton]}
                onPress={() => handleRejectProposal(proposal, messageId)}
              >
                <Text style={styles.rejectButtonText}>❌ Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.proposalButton, styles.counterButton]}
                onPress={() => handleCounterproposal(proposal, messageId)}
              >
                <Text style={styles.counterButtonText}>🔄 Contrapropuesta</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mostrar mensaje de estado cuando ya fue respondida */}
          {(proposal.estado === 'aceptada' || proposal.estado === 'rechazada' || proposal.estado === 'contraoferta') && (
            <View style={[styles.proposalStatus, {
              backgroundColor:
                proposal.estado === 'aceptada' ? '#10B981' :
                  proposal.estado === 'rechazada' ? '#EF4444' :
                    '#5B7EFF'
            }]}>
              <Text style={styles.proposalStatusText}>
                {proposal.estado === 'aceptada' ? '✅ Aceptada' :
                  proposal.estado === 'rechazada' ? '❌ Rechazada' :
                    '🔄 Contrapropuesta enviada'}
              </Text>
            </View>
          )}

          {/* Botón de pago para cliente cuando la propuesta está aceptada */}
          {/* SE MUESTRA SOLO SI: Estado es aceptada Y el usuario actual es el CLIENTE Y no está pagada */}
          {proposal.estado === 'aceptada' && currentUser && currentUser.id === proposal.client_id && !paidProposals.has(proposal.id) && (
            <TouchableOpacity
              style={[styles.proposalButton, { backgroundColor: '#009EE3', marginTop: 8 }]}
              onPress={() => {
                router.push({
                  pathname: '/pago-kushki-mock',
                  params: {
                    monto: proposal.monto_con_comision || proposal.monto,
                    nombreEvento: proposal.detalles || 'Evento Mivok',
                    proposalId: proposal.id,
                    clientId: currentUser.id,
                    djId: userId,
                  }
                });
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>💳 Pagar Ahora</Text>
            </TouchableOpacity>
          )}

          {/* Mostrar estado de pago si ya fue pagado */}
          {proposal.estado === 'aceptada' && currentUser && currentUser.id === proposal.client_id && paidProposals.has(proposal.id) && (
            <View style={[styles.proposalButton, { backgroundColor: '#22c55e', marginTop: 8, opacity: 0.8 }]}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>✅ Pagado</Text>
            </View>
          )}

          <Text style={styles.proposalTime}>{proposal.timestamp}</Text>
        </View>
      </View>
    );
  };

  // Componente para indicadores de lectura
  const ReadStatusIndicator = ({ isRead, sender }: { isRead?: boolean; sender: 'usuario' | 'dj' | 'system' }) => {
    if (sender !== 'usuario') return null;

    return (
      <Text style={[
        styles.readIndicator,
        isRead ? styles.readIndicatorRead : styles.readIndicatorSent
      ]}>
        ✓
      </Text>
    );
  };

  // Render message
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUserMessage = item.sender === 'usuario';
    const isSystemMessage = item.sender === 'system';

    // Mensaje de sistema (propuesta aceptada/rechazada)
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageBubble}>
            <Text style={styles.systemMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    if (item.isProposal && item.proposal) {
      return (
        <View style={[styles.messageRow, isUserMessage ? styles.userRow : styles.djRow]}>
          {!isUserMessage && dj && <Image source={{ uri: dj.imagen }} style={styles.avatar} />}
          {renderProposalCard(item.proposal, isUserMessage, item.id)}
          {isUserMessage && <View style={styles.avatarPlaceholder} />}
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isUserMessage ? styles.userRow : styles.djRow]}>
        {!isUserMessage && dj && <Image source={{ uri: dj.imagen }} style={styles.avatar} />}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
          <View style={[styles.messageBubble, isUserMessage ? styles.userBubble : styles.djBubble]}>
            <Text style={styles.messageText}>{item.text}</Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, isUserMessage ? styles.userTime : styles.djTime]}>
                {item.timestamp}
              </Text>
            </View>
          </View>
          {isUserMessage && <ReadStatusIndicator isRead={item.isRead} sender={item.sender} />}
        </View>
        {!isUserMessage && <View style={styles.avatarPlaceholder} />}
      </View>
    );
  }, [dj, isDJ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {!dj ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>DJ no encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5B7EFF" strokeWidth={2}>
                <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <Path d="M15 6l-6 6l6 6" />
              </Svg>
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.djHeaderName}>{dj?.nombre || userName || 'DJ'}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    dj?.estado === 'online' ? styles.statusOnline : styles.statusOffline,
                  ]}
                />
                <Text style={styles.statusText}>
                  {dj?.estado === 'online' ? 'En línea' : 'Desconectado'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => setShowMenu(true)}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5B7EFF" strokeWidth={2}>
                <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <Path d="M5 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                <Path d="M12 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                <Path d="M19 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              </Svg>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContainer}
              scrollIndicatorInsets={{ right: 1 }}
              showsVerticalScrollIndicator={false}
            />

            {/* Input Container */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowProposalModal(true)}
              >
                <Text style={styles.actionButtonText}>💰</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#666"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />

              <TouchableOpacity
                style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={inputText.trim() === ''}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="#fff">
                  <Path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.40,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4770573 C0.994623095,2.0541146 0.837654326,3.34399899 1.15159189,4.12942011 L3.03521743,10.5704131 C3.03521743,10.7275105 3.19218622,10.8846079 3.50612381,10.8846079 L16.6915026,11.6700948 C16.6915026,11.6700948 17.1624089,11.6700948 17.1624089,11.0929375 L17.1624089,12.4744748 C17.1624089,12.4744748 17.1624089,12.4744748 16.6915026,12.4744748 Z" />
                </Svg>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {/* Proposal Modal */}
          <Modal
            visible={showProposalModal}
            transparent
            animationType="slide"
            onRequestClose={() => {
              setShowProposalModal(false);
              setProposalStatus(null);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContent,
                proposalStatus === 'approved' && { borderTopWidth: 4, borderTopColor: '#10B981' },
                proposalStatus === 'rejected' && { borderTopWidth: 4, borderTopColor: '#EF4444' },
                proposalStatus === 'counter' && { borderTopWidth: 4, borderTopColor: '#FBBF24' },
              ]}>
                <View style={[
                  styles.modalHeader,
                  proposalStatus === 'approved' && { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                  proposalStatus === 'rejected' && { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                  proposalStatus === 'counter' && { backgroundColor: 'rgba(251, 191, 36, 0.1)' },
                ]}>
                  <Text style={[
                    styles.modalTitle,
                    proposalStatus === 'approved' && { color: '#10B981' },
                    proposalStatus === 'rejected' && { color: '#EF4444' },
                    proposalStatus === 'counter' && { color: '#FBBF24' },
                  ]}>
                    {proposalStatus === 'approved' ? '✓ Propuesta Aceptada' : proposalStatus === 'rejected' ? '✗ Propuesta Rechazada' : proposalStatus === 'counter' ? '🔄 Contrapropuesta' : 'Hacer propuesta'}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setShowProposalModal(false);
                    setProposalStatus(null);
                  }}>
                    <Text style={styles.modalCloseBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalDescription}>
                    {currentMode === 'dj' 
                      ? 'Ingresa los detalles de tu propuesta para el cliente.'
                      : 'Ingresa los detalles de tu propuesta para que el DJ pueda evaluarla.'
                    }
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>
                      {currentMode === 'dj' 
                        ? 'Monto a cobrar al cliente (CLP)'
                        : 'Monto para el DJ (CLP)'
                      }
                    </Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="50000"
                      placeholderTextColor="#666"
                      value={monto}
                      onChangeText={(text) => setMonto(text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                    {monto && parseInt(monto) > 0 && (
                      <View style={styles.comisionInfo}>
                        <Text style={styles.comisionText}>
                          💰 Comisión app (10%): ${Math.round(parseInt(monto) * 0.10).toLocaleString('es-CL')}
                        </Text>
                        <Text style={styles.comisionTotal}>
                          💳 Total a cobrar al cliente: ${Math.round(parseInt(monto) * 1.10).toLocaleString('es-CL')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Duración (horas)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="4"
                      placeholderTextColor="#666"
                      value={horas}
                      onChangeText={(text) => setHoras(text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Fecha del evento</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.datePickerText}>
                        {date.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(Platform.OS === 'ios');
                          if (selectedDate) setDate(selectedDate);
                        }}
                        style={Platform.OS === 'ios' ? { height: 120, marginTop: 10 } : undefined}
                      />
                    )}
                    {Platform.OS === 'ios' && showDatePicker && (
                      <TouchableOpacity style={styles.iosPickerDone} onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.iosPickerDoneText}>Listo</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Hora inicio</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Text style={styles.datePickerText}>
                        {startTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </Text>
                    </TouchableOpacity>
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={startTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          setShowStartTimePicker(Platform.OS === 'ios');
                          if (selectedDate) setStartTime(selectedDate);
                        }}
                        style={Platform.OS === 'ios' ? { height: 120, marginTop: 10 } : undefined}
                      />
                    )}
                    {Platform.OS === 'ios' && showStartTimePicker && (
                      <TouchableOpacity style={styles.iosPickerDone} onPress={() => setShowStartTimePicker(false)}>
                        <Text style={styles.iosPickerDoneText}>Listo</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Ubicación (obligatoria)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Lugar del evento"
                      placeholderTextColor="#666"
                      value={ubicacion}
                      onChangeText={setUbicacion}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Géneros (separados por coma, opcional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Reggaeton,Electrónica,House"
                      placeholderTextColor="#666"
                      value={generos}
                      onChangeText={setGeneros}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Detalles (opcional)</Text>
                    <TextInput
                      style={[styles.formInput, styles.formInputMultiline]}
                      placeholder="Cuéntale al DJ más detalles de tu evento..."
                      placeholderTextColor="#666"
                      value={detalles}
                      onChangeText={setDetalles}
                      multiline
                      maxLength={300}
                    />
                    <Text style={styles.characterCount}>{detalles.length}/300</Text>
                  </View>

                  <View style={styles.noteContainer}>
                    <Text style={styles.noteIcon}>💡</Text>
                    <Text style={styles.noteText}>
                      La otra parte revisará tu propuesta y podrá aceptarla, rechazarla o hacer una contraoferta.
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.cancelButton,
                    proposalStatus === 'approved' && { borderColor: '#10B981' },
                    proposalStatus === 'rejected' && { borderColor: '#EF4444' },
                    proposalStatus === 'counter' && { borderColor: '#FBBF24' },
                    ]}
                    onPress={() => {
                      setShowProposalModal(false);
                      setProposalStatus(null);
                    }}
                  >
                    <Text style={[styles.cancelButtonText,
                    proposalStatus === 'approved' && { color: '#10B981' },
                    proposalStatus === 'rejected' && { color: '#EF4444' },
                    proposalStatus === 'counter' && { color: '#FBBF24' },
                    ]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!monto || !horas) && styles.submitButtonDisabled,
                      proposalStatus === 'approved' && { backgroundColor: '#10B981' },
                      proposalStatus === 'rejected' && { backgroundColor: '#EF4444' },
                      proposalStatus === 'counter' && { backgroundColor: '#FBBF24' },
                    ]}
                    onPress={handleSendProposal}
                    disabled={!monto || !horas}
                  >
                    <Text style={styles.submitButtonText}>
                      {proposalStatus === 'approved' ? '✓ Aceptar' : proposalStatus === 'rejected' ? '✗ Rechazar' : proposalStatus === 'counter' ? '🔄 Contrapropuesta' : 
                        currentMode === 'dj' ? 'Enviar propuesta al cliente' : 'Enviar propuesta'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Menu Modal */}
          <Modal
            visible={showMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setShowMenu(false)}
          >
            <View style={styles.menuOverlay}>
              <TouchableOpacity
                style={styles.menuBackdrop}
                onPress={() => setShowMenu(false)}
              />

              <View style={styles.menuContent}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    console.log('Reportar chat');
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuIcon}>⚠️</Text>
                  <Text style={styles.menuItemText}>Reportar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    console.log('Silenciar chat');
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuIcon}>🔇</Text>
                  <Text style={styles.menuItemText}>Silenciar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    console.log('Ver perfil');
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuIcon}>👤</Text>
                  <Text style={styles.menuItemText}>Ver perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    console.log('Eliminar chat');
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuIcon}>🗑️</Text>
                  <Text style={styles.menuItemText}>Eliminar chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  keyboardAvoidingView: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
    backgroundColor: '#111',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  djHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: '#4ade80',
  },
  statusOffline: {
    backgroundColor: '#666',
  },
  statusText: {
    fontSize: 12,
    color: '#999',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 12,
    marginHorizontal: 0,
  },
  userRow: {
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  djRow: {
    justifyContent: 'flex-start',
    paddingLeft: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 4,
  },
  avatarPlaceholder: {
    width: 36,
  },
  messageBubble: {
    maxWidth: width * 0.68,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#5B7EFF',
    borderBottomRightRadius: 3,
  },
  djBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 3,
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 3,
    opacity: 0.6,
    fontWeight: '400',
  },
  userTime: {
    color: '#fff',
  },
  djTime: {
    color: '#bbb',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  systemMessageBubble: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#5B7EFF',
  },
  systemMessageText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  readIndicator: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 12,
    marginBottom: 2,
    marginLeft: 2,
    marginRight: 0,
  },
  readIndicatorSent: {
    color: '#fff',
    opacity: 0.8,
  },
  readIndicatorRead: {
    color: '#5B7EFF',
    opacity: 1,
    fontWeight: '900',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5B7EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#5B7EFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  proposalContainer: {
    marginHorizontal: 8,
  },
  proposalCard: {
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    maxWidth: width * 0.78,
  },
  proposalHeader: {
    marginBottom: 12,
  },
  proposalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  proposalStatus: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  proposalStatusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  proposalDetails: {
    marginBottom: 12,
  },
  proposalDetailRow: {
    marginBottom: 8,
  },
  proposalLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  proposalValue: {
    fontSize: 13,
    color: '#ddd',
  },
  proposalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFB800',
  },
  proposalActions: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 8,
  },
  proposalButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  counterButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5B7EFF',
  },
  counterButtonText: {
    color: '#5B7EFF',
    fontSize: 13,
    fontWeight: '600',
  },
  datePickerButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  datePickerText: {
    color: '#fff',
    fontSize: 14,
  },
  iosPickerDone: {
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#222',
    borderRadius: 8,
    marginTop: 4,
  },
  iosPickerDoneText: {
    color: '#5B7EFF',
    fontWeight: '600',
    fontSize: 14,
  },
  proposalTime: {
    fontSize: 10,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '50%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalCloseBtn: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  comisionInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#0a1a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5a2a',
  },
  comisionText: {
    fontSize: 12,
    color: '#66bb6a',
    marginBottom: 4,
  },
  comisionTotal: {
    fontSize: 13,
    color: '#81c784',
    fontWeight: '600',
  },
  formGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  formInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    textAlign: 'right',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 20,
    gap: 12,
  },
  noteIcon: {
    fontSize: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#ffc107',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#5B7EFF',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingRight: 16,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginRight: 0,
    overflow: 'hidden',
    width: 200,
    alignSelf: 'flex-end',
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
