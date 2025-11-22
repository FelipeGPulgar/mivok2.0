#!/bin/bash
# 🚀 SCRIPT DE VERIFICACIÓN RÁPIDA - MIVOK

echo "════════════════════════════════════════════════════════"
echo "🚀 VERIFICACIÓN DEL SISTEMA - MIVOK"
echo "════════════════════════════════════════════════════════"
echo ""

# 1. Verificar Node
echo "📦 Verificando Node.js..."
node --version
echo ""

# 2. Verificar npm
echo "📦 Verificando npm..."
npm --version
echo ""

# 3. Verificar dependencias instaladas
echo "📦 Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules existe"
else
    echo "⚠️ node_modules no existe, ejecutando npm install..."
    npm install
fi
echo ""

# 4. ESLint
echo "🔍 Ejecutando ESLint..."
npm run lint
LINT_STATUS=$?
if [ $LINT_STATUS -eq 0 ]; then
    echo "✅ ESLint: SIN ERRORES"
else
    echo "❌ ESLint: ERRORES ENCONTRADOS"
fi
echo ""

# 5. TypeScript
echo "🔍 Verificando TypeScript..."
npx tsc --noEmit
TS_STATUS=$?
if [ $TS_STATUS -eq 0 ]; then
    echo "✅ TypeScript: SIN ERRORES"
else
    echo "❌ TypeScript: ERRORES ENCONTRADOS"
fi
echo ""

# 6. Archivos criticos
echo "📁 Verificando archivos críticos..."
FILES=(
    "lib/chat-functions.ts"
    "lib/profile-functions.ts"
    "app/chat.tsx"
    "app/buscar-djs.tsx"
    "app/editar-perfil.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file NO ENCONTRADO"
    fi
done
echo ""

# 7. Documentación
echo "📚 Verificando documentación..."
DOCS=(
    "INDICE_DOCUMENTACION.md"
    "RESUMEN_IMPLEMENTACION.md"
    "PERFIL_CHAT_GUIA.md"
    "PRUEBAS_SISTEMA_REAL.md"
    "ESTADO_FINAL.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ❌ $doc NO ENCONTRADO"
    fi
done
echo ""

# 8. Resumen
echo "════════════════════════════════════════════════════════"
echo "✅ VERIFICACIÓN COMPLETADA"
echo "════════════════════════════════════════════════════════"
echo ""
echo "PRÓXIMOS PASOS:"
echo "1. npm start         (iniciar dev server)"
echo "2. Seleccionar a/i/w (Android/iOS/Web)"
echo "3. Autenticarse      (Google/Microsoft/Facebook)"
echo "4. Probar features   (perfil, chat, notificaciones)"
echo ""
echo "DOCUMENTACIÓN:"
echo "👉 Empezar en: INDICE_DOCUMENTACION.md"
echo ""
