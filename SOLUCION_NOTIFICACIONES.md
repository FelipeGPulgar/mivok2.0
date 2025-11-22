# 🔴 Solución: Notificaciones No Llegan al Home DJ

## El Problema
Cuando un cliente envía un mensaje a un DJ, el badge rojo (puntito) NO aparece en la pantalla home del DJ. Solo aparece cuando el DJ entra en la pantalla de mensajes.

## Causas Posibles

### 1. ❌ Suscripción Realtime NO está funcionando
- La tabla `messages` no tiene realtime habilitado
- Las RLS policies están bloqueando la suscripción
- El filtro del canal es incorrecto

### 2. ❌ El Polling NO está detectando los cambios
- `getUnreadMessages()` no trae los mensajes correctamente
- El `receiver_id` no coincide con el `currentUserId`

### 3. ❌ El re-render del BottomNavBar no se dispara
- El contexto no está propagando cambios
- React no está re-renderizando el componente

## 🛠️ Solución: Pasos a Seguir

### PASO 1: Verificar Supabase - Tabla Messages
1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta esta query para verificar la estructura:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
```

**Debe tener estos campos:**
- `id` (uuid)
- `sender_id` (uuid)
- `receiver_id` (uuid)
- `content` (text)
- `is_read` (boolean) ← **CRÍTICO: este debe existir**
- `created_at` (timestamp)

### PASO 2: Verificar Realtime está Habilitado
1. Ve a Supabase Dashboard → Database → Publications
2. Verifica que `messages` tabla esté en la lista de publicaciones
3. Si NO está, ejecuta en SQL Editor:

```sql
ALTER TABLE public.messages REPLICA IDENTITY FULL;
```

### PASO 3: Verificar RLS Policies
1. Ve a Supabase Dashboard → Authentication → Policies
2. Verifica que existan estas políticas en la tabla `messages`:

```sql
-- Política 1: Ver mensajes propios
CREATE POLICY "Usuarios pueden ver sus propios mensajes"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Política 2: Enviar mensajes
CREATE POLICY "Usuarios pueden enviar mensajes"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Política 3: Actualizar mensajes
CREATE POLICY "Usuarios pueden actualizar sus mensajes"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
```

Si NO existen, cópialas del archivo `SQL_REALTIME_SETUP.sql` en la raíz del proyecto.

### PASO 4: Habilitar RLS en la Tabla
1. Ve a Supabase Dashboard → Database → Tables → messages
2. Click en "Security" tab
3. Habilita "Enable Row Level Security (RLS)"

### PASO 5: Verificar que los Mensajes se Insertan Correctamente
1. En SQL Editor, ejecuta:

```sql
SELECT id, sender_id, receiver_id, content, is_read, created_at 
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;
```

**Verifica:**
- ✅ ¿Aparecen nuevos mensajes cuando se envían?
- ✅ ¿El `is_read` es `false` inicialmente?
- ✅ ¿El `receiver_id` es el UUID del DJ?

### PASO 6: Probar Localmente

En tu dispositivo, abre la consola de Expo Go y espera a ver estos logs:

```
✅ NotificationContext inicializado para usuario: [UUID]
✅ Conteo inicial: [N] mensajes no leídos
🔔 Iniciando suscripción a mensajes para userId: [UUID]
✅ Canal mensajes_recibidos: SUBSCRIBED
✅ Canal mensajes_enviados: SUBSCRIBED
🔄 Poll #1: sin cambios (count=0)
```

Cuando un cliente envíe un mensaje, deberías ver:

```
📨 Mensaje RECIBIDO: [ID] from [SENDER_ID], is_read: false
📢 Nuevo mensaje recibido en NotificationContext: [ID]
🔴 Incrementando contador (mensaje no leído)
📊 Contador actualizado: ref=1
🎨 BottomNavBar renderizado - finalUnreadCount: 1
```

Si NO ves "Mensaje RECIBIDO", entonces **Realtime NO está funcionando** o las RLS están bloqueando.

### PASO 7: Ejecutar Diagnóstico (Opcional)
Si quieres verificar todo automáticamente, en la consola JS ejecuta:

```javascript
import { runNotificationDiagnostics } from './lib/diagnostic-notifications';
await runNotificationDiagnostics();
```

## 📁 Archivos Actualizados

- ✅ `lib/chat-functions.ts` - Suscripción mejorada (dos canales separados)
- ✅ `lib/NotificationContext.tsx` - Polling cada 5 segundos (más agresivo)
- ✅ `SQL_REALTIME_SETUP.sql` - Script de configuración
- ✅ `lib/diagnostic-notifications.ts` - Herramienta de diagnóstico

## 🎯 Resumen Rápido

**Si los logs en paso 6 muestran "Mensaje RECIBIDO":**
→ Realtime está funcionando. El problema es el polling o re-render.
→ Verifica que BottomNavBar esté usando `useNotifications()`.

**Si NO ves "Mensaje RECIBIDO":**
→ Realtime NO está funcionando.
→ Ejecuta los pasos 2-4 en Supabase.

**Si ves TODOS los logs pero el badge NO aparece:**
→ El re-render no se está disparando.
→ Verifica que `<NotificationProvider>` envuelve toda la app en `_layout.tsx`.
