# ✅ CHECKLIST: Arreglando Notificaciones en Home DJ

## PASO 1: Actualizar el Código (✅ YA HECHO)
- [x] `lib/chat-functions.ts` - Suscripción separada para recibidos/enviados
- [x] `lib/NotificationContext.tsx` - Polling cada 5 segundos
- [x] `app/home-dj.tsx` - Agregar hook y logging
- [x] `app/home-cliente.tsx` - Agregar hook y logging

## PASO 2: Configurar Supabase (⏳ HACER ESTO AHORA)

### 2.1 Verificar que la tabla `messages` existe
- [ ] Ve a Supabase → Database → Tables
- [ ] ¿Ves la tabla `messages`?
- [ ] Si NO existe, crea la tabla con este SQL:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Habilitar Realtime en la tabla messages
- [ ] Ve a Supabase → Database → Publications
- [ ] ¿Está `messages` en la lista?
- [ ] Si NO, ve a SQL Editor y ejecuta:
```sql
ALTER TABLE public.messages REPLICA IDENTITY FULL;
```

### 2.3 Habilitar RLS (Row Level Security)
- [ ] Ve a Supabase → Database → Tables → messages
- [ ] Tab "Security"
- [ ] ¿Está "Enable Row Level Security" activado?
- [ ] Si NO, actívalo

### 2.4 Crear las RLS Policies
- [ ] Ve a Supabase → Authentication → Policies → messages table
- [ ] ¿Existen estas 3 políticas?
  - [ ] "Usuarios pueden ver sus propios mensajes" (SELECT)
  - [ ] "Usuarios pueden enviar mensajes" (INSERT)
  - [ ] "Usuarios pueden actualizar sus mensajes" (UPDATE)
- [ ] Si NO existen, crea cada una:

```sql
-- 1. Ver mensajes
CREATE POLICY "Usuarios pueden ver sus propios mensajes"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. Enviar mensajes
CREATE POLICY "Usuarios pueden enviar mensajes"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 3. Actualizar mensajes
CREATE POLICY "Usuarios pueden actualizar sus mensajes"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
```

### 2.5 Verificar que hay mensajes en la tabla
- [ ] Ve a Supabase → SQL Editor
- [ ] Ejecuta:
```sql
SELECT id, sender_id, receiver_id, content, is_read, created_at 
FROM messages 
ORDER BY created_at DESC 
LIMIT 5;
```
- [ ] ¿Ves mensajes?
- [ ] ¿El `is_read` es `false` para mensajes nuevos?
- [ ] ¿El `receiver_id` es un UUID válido?

## PASO 3: Probar en la App (⏳ HACER ESTO DESPUÉS)

### 3.1 Limpiar cache y recargar
- [ ] Reinicia Expo Go
- [ ] `npm start` en la terminal
- [ ] Selecciona la plataforma (iOS/Android)

### 3.2 Verificar logs iniciales
- [ ] Abre la consola (en Expo Go o DevTools)
- [ ] Deberías ver:
```
✅ NotificationContext inicializado para usuario: [UUID]
✅ Conteo inicial: [N] mensajes no leídos
🔔 Iniciando suscripción a mensajes para userId: [UUID]
✅ Canal mensajes_recibidos: SUBSCRIBED
✅ Canal mensajes_enviados: SUBSCRIBED
```

### 3.3 Buscar logs de polling
- [ ] Espera 5-10 segundos
- [ ] Deberías ver:
```
🔄 Poll #1: sin cambios (count=0)
🔄 Poll #2: sin cambios (count=0)
```

### 3.4 Probar enviar un mensaje
- [ ] Desde otro navegador/dispositivo, envía un mensaje al DJ
- [ ] Mira la consola y busca:
```
📨 Mensaje RECIBIDO: [ID]
📢 Nuevo mensaje recibido
🔴 Incrementando contador
📊 Contador actualizado: ref=1
🏠 Home DJ: unreadCount del contexto = 1
🎨 BottomNavBar renderizado - finalUnreadCount: 1
```

### 3.5 Verificar que el badge aparece
- [ ] ¿Aparece el punto rojo en el tab "Alertas"?
- [ ] Si SÍ → ✅ **LISTO**
- [ ] Si NO → Revisa los logs para ver dónde falla

## PASO 4: Troubleshooting (SI ALGO NO FUNCIONA)

### Problema: No veo ningún log
**Solución:**
- [ ] Verifica que estés en la consola de Expo Go correctamente
- [ ] Reinicia la app con `npm start`
- [ ] En Expo, presiona `r` para recargar

### Problema: Veo logs pero NO veo "Canal mensajes_recibidos: SUBSCRIBED"
**Solución:**
- [ ] Verifica que Realtime esté habilitado en Supabase
- [ ] Ejecuta `ALTER TABLE public.messages REPLICA IDENTITY FULL;`
- [ ] Reinicia la app

### Problema: Veo "Mensaje RECIBIDO" pero el badge NO aparece
**Solución:**
- [ ] Verifica que BottomNavBar esté importando `useNotifications()`
- [ ] Verifica que `<NotificationProvider>` envuelve la app en `app/_layout.tsx`
- [ ] Prueba forzar un re-render: va a otra pantalla y vuelve

### Problema: El polling dice "sin cambios" pero hay mensajes en la DB
**Solución:**
- [ ] Verifica que `getUnreadMessages()` tiene el WHERE correcto
- [ ] En SQL, ejecuta manualmente y verifica que devuelve mensajes:
```sql
SELECT * FROM messages WHERE receiver_id = 'tu-uuid-aqui' AND is_read = false;
```

## PASO 5: Opcional - Ejecución del Script de Diagnóstico

Si aún hay problemas, puedes correr el diagnóstico automático:

1. En Expo Go, abre la consola
2. Ejecuta:
```javascript
import { runNotificationDiagnostics } from './lib/diagnostic-notifications';
runNotificationDiagnostics();
```
3. Espera a que termine y revisa los resultados

## Resumen Rápido

| Paso | Qué | Verificar |
|------|-----|-----------|
| 1 | Código | ✅ Ya actualizado |
| 2.1 | Tabla messages | Exista y tenga `is_read` |
| 2.2 | Realtime | `ALTER TABLE messages REPLICA IDENTITY FULL;` |
| 2.3 | RLS | Activado en la tabla |
| 2.4 | Policies | Las 3 políticas creadas |
| 2.5 | Mensajes | Existan y `is_read=false` |
| 3.1 | App | `npm start` y recargar |
| 3.2 | Logs | Ver `SUBSCRIBED` |
| 3.3 | Polling | Ver `Poll #1, Poll #2...` |
| 3.4 | Test | Enviar mensaje y ver logs |
| 3.5 | Badge | Aparece punto rojo ✅ |

**Si llegas hasta aquí sin problemas: ¡LISTO!** ✅
