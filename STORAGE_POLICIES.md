## 🔐 POLÍTICAS DE STORAGE PARA BUCKET dj_gallery

### ✅ Opción 1: Usando SQL Editor (RECOMENDADO)

Copia y pega este código en el **SQL Editor** de Supabase:

```sql
-- Política 1: Lectura pública (cualquiera puede VER las fotos)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'dj_gallery');

-- Política 2: Usuarios autenticados pueden SUBIR fotos en su carpeta
CREATE POLICY "Authenticated users can upload to their folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política 3: Usuarios pueden ACTUALIZAR sus propias fotos
CREATE POLICY "Authenticated users can update their files" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política 4: Usuarios pueden ELIMINAR sus propias fotos
CREATE POLICY "Authenticated users can delete their files" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 📋 Opción 2: Usando Dashboard (interfaz gráfica)

Si prefieres no usar SQL, puedes crear las políticas en el dashboard:

1. **Ve a Storage** → **dj_gallery** → **Policies**

2. **Click en "+ New Policy"** (4 veces, una por cada política)

#### **Política 1: Lectura Pública**
- **Allowed operations:** SELECT
- **Target role:** Public
- **Using expression:** `bucket_id = 'dj_gallery'`

#### **Política 2: Subir fotos (usuarios autenticados)**
- **Allowed operations:** INSERT
- **Target role:** Authenticated
- **With check expression:**
```
bucket_id = 'dj_gallery' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

#### **Política 3: Actualizar fotos (dueño)**
- **Allowed operations:** UPDATE
- **Target role:** Authenticated
- **Using expression:**
```
bucket_id = 'dj_gallery' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```
- **With check expression:** (igual al Using expression)

#### **Política 4: Eliminar fotos (dueño)**
- **Allowed operations:** DELETE
- **Target role:** Authenticated
- **Using expression:**
```
bucket_id = 'dj_gallery' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

---

## 📝 ¿Qué hace cada política?

| Política | Acción | Quién | Descripción |
|----------|--------|-------|-------------|
| **Public Access** | SELECT (lectura) | Cualquiera | Todos pueden ver las fotos |
| **Upload to folder** | INSERT (crear) | Usuarios autenticados | Solo pueden subir en su carpeta (user_id) |
| **Update files** | UPDATE (editar) | Dueño | Solo el dueño puede editar sus fotos |
| **Delete files** | DELETE (eliminar) | Dueño | Solo el dueño puede eliminar sus fotos |

---

## ✅ Verificación

Una vez creadas, deberías ver 4 políticas en `Storage → dj_gallery → Policies`:
- ✅ Public Access
- ✅ Authenticated users can upload to their folder
- ✅ Authenticated users can update their files
- ✅ Authenticated users can delete their files

¡Listo! 🎉
