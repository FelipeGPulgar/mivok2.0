// lib/diagnostic-notifications.ts
// Script para diagnosticar problemas con notificaciones en tiempo real

import * as chatFunctions from './chat-functions';
import { getCurrentUser } from './supabase';

export const runNotificationDiagnostics = async () => {
  console.log('\n🔍 ===== INICIANDO DIAGNOSTICO DE NOTIFICACIONES =====\n');

  try {
    // 1. Verificar usuario actual
    console.log('1️⃣  Verificando usuario actual...');
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ No hay usuario autenticado');
      return;
    }
    console.log(`✅ Usuario: ${user.id}`);
    console.log(`   Email: ${user.email}`);

    // 2. Verificar mensajes no leídos
    console.log('\n2️⃣  Buscando mensajes no leídos...');
    const unreadMessages = await chatFunctions.getUnreadMessages(user.id);
    console.log(`✅ Total de mensajes no leídos: ${unreadMessages?.length || 0}`);
    if (unreadMessages && unreadMessages.length > 0) {
      unreadMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ID: ${msg.id}`);
        console.log(`      From: ${msg.sender_id}`);
        console.log(`      Content: "${msg.content}"`);
        console.log(`      Created: ${msg.created_at}`);
        console.log(`      Is Read: ${msg.is_read}`);
      });
    }

    // 3. Intentar suscribirse a nuevos mensajes
    console.log('\n3️⃣  Iniciando suscripción a nuevos mensajes...');
    console.log('   ⏳ Esperando por 10 segundos para detectar cambios...');
    
    let messageReceived = false;
    const unsubscribe = chatFunctions.subscribeToAllMessages(user.id, (newMessage: any) => {
      messageReceived = true;
      console.log(`\n✅ NUEVO MENSAJE RECIBIDO en suscripción:`);
      console.log(`   ID: ${newMessage.id}`);
      console.log(`   From: ${newMessage.sender_id}`);
      console.log(`   To: ${newMessage.receiver_id}`);
      console.log(`   Content: "${newMessage.content}"`);
      console.log(`   Is Read: ${newMessage.is_read}`);
    });

    // Esperar 10 segundos
    await new Promise(resolve => setTimeout(resolve, 10000));

    if (!messageReceived) {
      console.log('\n⚠️  No se recibieron mensajes en 10 segundos');
      console.log('   Posibles causas:');
      console.log('   - No hay nuevos mensajes siendo insertados');
      console.log('   - Realtime no está habilitado en la tabla messages');
      console.log('   - Las RLS policies están bloqueando la suscripción');
    } else {
      console.log('\n✅ ¡Suscripción funcionando correctamente!');
    }

    unsubscribe();

    // 4. Resumen
    console.log('\n📊 ===== RESUMEN DEL DIAGNÓSTICO =====');
    console.log(`✅ Usuario autenticado: ${user.id}`);
    console.log(`✅ Mensajes no leídos encontrados: ${unreadMessages?.length || 0}`);
    console.log(`${messageReceived ? '✅' : '⚠️'} Suscripción realtime: ${messageReceived ? 'Funcionando' : 'No detectó cambios'}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
};

// Ejecutar desde la consola con:
// import { runNotificationDiagnostics } from './lib/diagnostic-notifications';
// runNotificationDiagnostics();
