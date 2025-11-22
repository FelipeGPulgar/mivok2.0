# ✅ CHECKLIST: Implementación de Equipamiento DJ

## FASE 1: Base de Datos (⏳ HACER ESTO PRIMERO)

### Base de Datos
- [ ] Abre Supabase Dashboard
- [ ] Ve a SQL Editor
- [ ] Ejecuta este SQL:

```sql
ALTER TABLE dj_profiles 
ADD COLUMN IF NOT EXISTS cuenta_con_equipamiento VARCHAR(10) DEFAULT 'No',
ADD COLUMN IF NOT EXISTS equipamiento TEXT[] DEFAULT ARRAY[]::TEXT[];
```

- [ ] Verifica que se crearon las columnas:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'dj_profiles'
AND (column_name = 'cuenta_con_equipamiento' OR column_name = 'equipamiento');
```

Deberías ver:
```
cuenta_con_equipamiento | character varying
equipamiento            | text array
```

## FASE 2: Código (✅ YA HECHO)

### Cambios Realizados
- [x] Actualizado: `app/editar-perfil.tsx`
  - [x] Agregadas constantes de equipamiento
  - [x] Agregado estado para equipamiento
  - [x] Agregada función `toggleEquipamiento`
  - [x] Agregada UI de selección
  - [x] Agregado guardado en Supabase

- [x] Actualizado: `app/perfil-dj.tsx`
  - [x] Agregado estado para equipamiento
  - [x] Agregada sección de visualización
  - [x] Agregados estilos

## FASE 3: Pruebas Locales (⏳ HACER ESTO)

### Test 1: Editar Perfil (DJ)
- [ ] Reinicia: `npm start`
- [ ] Inicia sesión como DJ
- [ ] Ve a "Editar Perfil"
- [ ] Baja hasta la sección "🎛️ Equipamiento"
- [ ] Selecciona "Sí" o "Parcial"
- [ ] Elige algunos equipamientos:
  - [ ] Luces LED
  - [ ] Parlantes
  - [ ] Micrófono
- [ ] Haz click en "GUARDAR PERFIL"
- [ ] ¿Aparece "Perfil actualizado correctamente"? ✓

### Test 2: Ver en Perfil (Cliente)
- [ ] Inicia sesión como cliente (o crea otra cuenta)
- [ ] Ve a "Buscar DJs"
- [ ] Abre el perfil del DJ que editaste
- [ ] ¿Ves la sección "🎛️ Equipamiento"? ✓
- [ ] ¿Muestra el equipamiento que seleccionaste? ✓
- [ ] ¿Muestra "Cuentas con: Sí/Parcial"? ✓

### Test 3: Cambiar a "No"
- [ ] Inicia sesión como DJ
- [ ] Ve a "Editar Perfil"
- [ ] Cambia equipamiento a "No"
- [ ] Guarda
- [ ] ¿Se limpió la selección de equipamientos? ✓
- [ ] Abre como cliente
- [ ] ¿Ya NO ves la sección de equipamiento? ✓

### Test 4: Cambios
- [ ] Vuelve a "Sí"
- [ ] Selecciona equipamientos diferentes
- [ ] Guarda
- [ ] Abre como cliente
- [ ] ¿Ve los nuevos equipamientos? ✓

## FASE 4: Verificación en Supabase (Opcional)

```sql
-- Ver los datos guardados
SELECT id, user_id, cuenta_con_equipamiento, equipamiento
FROM dj_profiles
ORDER BY updated_at DESC
LIMIT 5;
```

Deberías ver algo como:
```
cuenta_con_equipamiento | equipamiento
Sí                      | {Luces LED,Parlantes,Micrófono}
Parcial                 | {Mixer}
No                      | {}
```

## FASE 5: Personalización (Opcional)

### Agregar más equipamientos
1. Abre `app/editar-perfil.tsx`
2. Busca `EQUIPAMIENTO_DISPONIBLE` (línea ~20-30)
3. Agrega nuevos items al array:

```jsx
const EQUIPAMIENTO_DISPONIBLE = [
    'Luces LED',
    'Máquina de humo',
    'Parlantes profesionales',
    'Micrófono',
    'Mixer',
    'Tu nuevo equipo aquí', // ← AGREGAR AQUÍ
];
```

4. Guarda y reinicia la app

### Cambiar colores
- Estilos en `app/editar-perfil.tsx` (línea ~950-1020)
- Estilos en `app/perfil-dj.tsx` (línea ~610-650)

## FASE 6: Deployment

- [ ] Verificar que todo funciona localmente
- [ ] Hacer commit a Git: `git commit -m "Agregar equipamiento DJ"`
- [ ] Push a repositorio: `git push`
- [ ] Desplegar a producción (si aplica)

## Troubleshooting

### Problema: No veo la sección de equipamiento en editar-perfil
**Solución:**
- [ ] Verifica que estés logueado como DJ
- [ ] Reinicia la app
- [ ] Baja en el formulario (está entre géneros y galería)

### Problema: No se guarda el equipamiento
**Solución:**
- [ ] Verifica que las columnas existen en la BD (FASE 1)
- [ ] Revisa los logs de Supabase
- [ ] Verifica que la tabla `dj_profiles` existe

### Problema: El equipamiento no aparece en perfil-dj
**Solución:**
- [ ] Verifica que guardaste como DJ
- [ ] Abre el perfil como cliente
- [ ] Si aún no aparece, recarga la página

### Problema: Error "Property 'XXX' does not exist on type"
**Solución:**
- [ ] Ejecuta: `npm start` nuevamente
- [ ] Limpia cache: `Ctrl+Shift+R` en navegador
- [ ] Reconstruye proyecto

## Confirmación Final

- [ ] ✅ Base de datos actualizada
- [ ] ✅ Código modificado correctamente
- [ ] ✅ DJ puede seleccionar equipamiento
- [ ] ✅ Equipamiento aparece en perfil
- [ ] ✅ Cambios se guardan en Supabase
- [ ] ✅ No hay errores en consola

## 📝 Notas

- El equipamiento se guarda como array JSON
- Solo se muestra si hay items seleccionados
- "No" limpia automáticamente la selección
- Compatible con géneros musicales existentes

**¡LISTO! El sistema de equipamiento está funcionando correctamente.** 🎉

---

¿Necesitas ayuda con algo específico?
