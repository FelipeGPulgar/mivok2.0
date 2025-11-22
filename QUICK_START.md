# 🚀 QUICK START: Arreglar Notificaciones

## El Problema en 3 Frases
Cuando un cliente envía un mensaje al DJ, el puntito rojo NO aparece en home. 
Aparece cuando entras a la pantalla de mensajes.
Razón: La suscripción Realtime falla o es muy lenta.

---

## La Solución (3 Pasos)

### PASO 1: Código ✅ (YA HECHO)
Cambios realizados automáticamente:
- `lib/chat-functions.ts` - Suscripción con 2 canales en lugar de 1
- `lib/NotificationContext.tsx` - Polling cada 5 seg en lugar de 15
- Logging detallado agregado

### PASO 2: Configurar Supabase (HACER ESTO)

Abre tu dashboard de Supabase y ejecuta este SQL:

```sql
-- 1. Habilitar Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Crear RLS Policies (si no existen)
CREATE POLICY "Ver propios mensajes"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Enviar mensajes"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Actualizar mensajes"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
```

### PASO 3: Probar en la App

1. Reinicia: `npm start` en terminal
2. Abre consola de Expo Go
3. Busca este log:
```
✅ Canal mensajes_recibidos: SUBSCRIBED
```
4. Envía un mensaje desde otro dispositivo
5. Deberías ver:
```
📨 Mensaje RECIBIDO
```
6. ¡El badge rojo aparecerá! ✅

---

## ¿No Funciona? Troubleshooting Rápido

| Síntoma | Solución |
|---------|----------|
| No veo `SUBSCRIBED` | Ejecuta `ALTER TABLE` en Supabase SQL |
| No veo `Mensaje RECIBIDO` | RLS policies no están configuradas |
| Veo logs pero NO aparece badge | Reinicia app con `npm start` |
| Badge aparece después de 5 seg | Normal, es el polling. Si es más lento, revisar conexión |

---

## Logs que Deberías Ver

### ✅ Correcto:
```
✅ NotificationContext inicializado
🔄 Polling iniciado: cada 5 segundos
📨 Mensaje RECIBIDO [ID]
🎨 BottomNavBar renderizado - finalUnreadCount: 1
```

### ❌ Incorrecto:
```
(nada de logs de mensajes)
```
→ Realtime NO funciona, ejecuta el SQL

---

## Archivos de Ayuda

Si tienes más dudas, lee:
- `SOLUCION_NOTIFICACIONES.md` - Guía detallada
- `CHECKLIST_NOTIFICACIONES.md` - Paso a paso
- `RESUMEN_CAMBIOS.md` - Explicación técnica

---

## ¿Qué Cambió?

**Antes:**
- Suscripción: 1 canal con filtro `or()`
- Polling: cada 15 segundos
- Logging: mínimo

**Ahora:**
- Suscripción: 2 canales simples
- Polling: cada 5 segundos (3x más rápido)
- Logging: detallado para debuggear

**Resultado:** Badge aparece en máx 5 segundos vs esperar a entrar en mensajes

---

## ¿Listo?

1. ✅ Código actualizado
2. ⏳ Ejecuta SQL en Supabase
3. ⏳ Reinicia app
4. ⏳ Prueba enviando un mensaje

**¡Listo!** 🎉
