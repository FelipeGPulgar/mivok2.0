# 📊 Resumen de Cambios para Notificaciones en Tiempo Real

## Cambios Realizados

### 1. `lib/chat-functions.ts` - Suscripción Mejorada
**Problema:** Filtro `or()` no funciona correctamente en Supabase
**Solución:** Crear dos canales separados para mensajes recibidos y enviados

```diff
- filter: `or(sender_id=eq.${userId},receiver_id=eq.${userId})`
+ Dos canales: uno para receiver_id=eq.${userId}, otro para sender_id=eq.${userId}
```

**Beneficios:**
- ✅ Más confiable (dos filtros simples en lugar de uno complejo)
- ✅ Mejor logging (puedes ver si llegó como "RECIBIDO" o "ENVIADO")
- ✅ Listeners por estado separados

### 2. `lib/NotificationContext.tsx` - Polling Agresivo
**Problema:** Polling cada 15 segundos es demasiado lento
**Solución:** Polling cada 5 segundos + logging detallado

```diff
- Interval: 15000ms (cada 15 segundos)
+ Interval: 5000ms (cada 5 segundos)
+ Logging que muestra Poll #1, Poll #2, etc.
```

**Beneficios:**
- ✅ Detección más rápida de mensajes (máx 5 segundos vs 15)
- ✅ Puedes ver si el polling está funcionando
- ✅ Si realtime falla, el polling lo cachará rápidamente

### 3. `app/home-dj.tsx` y `app/home-cliente.tsx` - Debugging
**Cambio:** Agregar hook `useNotifications()` y logging

```jsx
const { unreadCount } = useNotifications();
useEffect(() => {
  console.log(`🏠 Home DJ: unreadCount del contexto = ${unreadCount}`);
}, [unreadCount]);
```

**Beneficios:**
- ✅ Verifica que el contexto se está actualizando
- ✅ Ve en tiempo real cuando cambia el contador

## Flujo Esperado Cuando Llega un Mensaje

```
Cliente envía mensaje
        ↓
Supabase: INSERT en tabla messages (receiver_id = DJ_ID)
        ↓
Realtime: Se dispara INSERT event
        ↓
subscribeToAllMessages() callback: Detecta mensaje RECIBIDO
        ↓
NotificationContext: Incrementa unreadCount
        ↓
setUnreadCount(count) → React re-render
        ↓
BottomNavBar: useNotifications() lee el nuevo valor
        ↓
Badge rojo aparece ✅
```

## Diagnóstico Visual en Consola

### ✅ FUNCIONA CORRECTAMENTE:
```
🔔 Iniciando suscripción a mensajes para userId: [UUID]
✅ Canal mensajes_recibidos: SUBSCRIBED
✅ Canal mensajes_enviados: SUBSCRIBED
🔄 Poll #1: sin cambios (count=0)
🔄 Poll #2: sin cambios (count=0)

[Usuario envía mensaje]

📨 Mensaje RECIBIDO: [ID] from [SENDER], is_read: false
📢 Nuevo mensaje recibido en NotificationContext: [ID]
🔴 Incrementando contador (mensaje no leído)
📊 Contador actualizado: ref=1
🏠 Home DJ: unreadCount del contexto = 1
🎨 BottomNavBar renderizado - finalUnreadCount: 1
```

### ❌ NO FUNCIONA (falta del canal):
```
🔔 Iniciando suscripción a mensajes para userId: [UUID]
✅ Canal mensajes_recibidos: SUBSCRIBED
✅ Canal mensajes_enviados: SUBSCRIBED
🔄 Poll #1: sin cambios (count=0)

[Usuario envía mensaje]

🔄 Poll #3: sin cambios (count=0)
[El polling sigue sin ver cambios]
```
→ **Causa:** Realtime NO está habilitado O RLS está bloqueando

### ❌ NO FUNCIONA (polling detecta pero UI no se actualiza):
```
📨 Mensaje RECIBIDO: [ID]...
📊 POLLING DETECTÓ CAMBIO: 0 → 1 (Poll #4)

[Badge no aparece en UI]
```
→ **Causa:** BottomNavBar no se re-renderiza (problema de React)

## Archivos a Ejecutar/Revisar

### En Supabase SQL Editor:
```sql
-- Copia el contenido de: SQL_REALTIME_SETUP.sql
```

### En Consola de Expo Go (Opcional):
```javascript
import { runNotificationDiagnostics } from './lib/diagnostic-notifications';
await runNotificationDiagnostics();
```

### En Browser DevTools (si está habilitado):
Abre console y busca logs con filtro: `🔔 🔄 📨 🔴 📊`

## Próximos Pasos

1. ✅ Aplicar cambios del código (ya hecho)
2. ⏳ Ejecutar setup SQL en Supabase (ver SOLUCION_NOTIFICACIONES.md)
3. ⏳ Probar en el dispositivo
4. ⏳ Ver los logs en consola
5. ⏳ Confirmar que badge aparece
