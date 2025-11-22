#!/bin/bash
# Script para ejecutar la app con logging de notificaciones

# Limpia la consola
clear

echo "🚀 Iniciando Mivok con debugging de notificaciones..."
echo ""
echo "📋 Qué verificar:"
echo "  1. Cuando la app carga, deberías ver: '✅ NotificationContext inicializado para usuario: [ID]'"
echo "  2. Luego: '✅ Conteo inicial: [N] mensajes no leídos'"
echo "  3. El log '🔄 Polling periódico' aparecerá cada 15 segundos"
echo "  4. En home DJ/Cliente verás: '🏠 Home DJ/Cliente: unreadCount del contexto = [N]'"
echo "  5. Cuando llega un mensaje: '📢 Nuevo mensaje recibido' + '🔴 Incrementando contador'"
echo "  6. BottomNavBar debería loguear: '🎨 BottomNavBar renderizado - finalUnreadCount: [N]'"
echo ""
echo "⚠️  Si no ves estos logs, revisa:"
echo "  - ¿Está configurada la tabla 'messages' en Supabase?"
echo "  - ¿El receiver_id del mensaje coincide con el usuario actual?"
echo "  - ¿Está bien suscrito el canal Supabase?"
echo ""

npm start
