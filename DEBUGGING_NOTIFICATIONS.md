# 🔴 Debugging: Notificaciones no aparecen en home/más

## Problema
Badge rojo (puntito) no aparece en el tab "Alertas" cuando el usuario está en pantallas de home DJ/Cliente, pero SÍ aparece cuando entra en alertas/mensajes.

## Hipótesis Actual
El contexto de notificaciones ACTUALIZA el estado, pero BottomNavBar no re-renderiza en las pantallas de home.

## Cambios Implementados

### 1. NotificationContext.tsx
- ✅ **Ref tracking**: Agregado `unreadCountRef` para evitar stale closures
- ✅ **Real-time + Polling**: Suscripción a Supabase + polling cada 15 segundos
- ✅ **Logging mejorado**: Console logs en cada actualización de contador
- ✅ **Direct state updates**: Usando valores directos en lugar de callbacks

### 2. BottomNavBar.tsx
- ✅ **Logging agregado**: Console log cada render para verificar que sucede
- ✅ **Context hook**: Usa `useNotifications()` correctamente

### 3. chat-functions.ts
- ✅ **Logging en getUnreadMessages**: Más detalle sobre qué se está consultando

## Testing Steps

### Opción 1: Visual
1. Abre la app en home DJ
2. Abre otra ventana y envía un mensaje
3. Verifica la consola:
   - ¿Ves "🎨 BottomNavBar renderizado"?
   - ¿Ves "📢 Nuevo mensaje recibido"?
   - ¿Ves "📊 Contador actualizado"?

### Opción 2: Forzar Re-render
Si no funciona, prueba esto en home-dj.tsx:
```tsx
const { unreadCount } = useNotifications();
useEffect(() => {
  console.log('🔔 Home re-renderizado, unreadCount:', unreadCount);
}, [unreadCount]);
```

### Opción 3: Verificar Supabase
- ✅ ¿Está configurada la tabla `messages` con `is_read` boolean?
- ✅ ¿Están llegando mensajes NEW a la tabla?
- ✅ ¿El `receiver_id` en los mensajes coincide con el userId actual?

## Próximos Pasos Si No Funciona
1. Revisar si `subscribeToAllMessages()` en chat-functions.ts está bien suscrito al canal
2. Verificar que el callback se dispara (agregar más logs)
3. Considerar usar `useEffect` en home-dj.tsx con `useFocusEffect` para re-suscribir

## Archivos Modificados
- `lib/NotificationContext.tsx` - Mejorado ref tracking y polling
- `components/BottomNavBar.tsx` - Agregado logging
- `lib/chat-functions.ts` - Agregado logging en getUnreadMessages
