#!/usr/bin/env pwsh
# 🚀 SCRIPT DE VERIFICACIÓN RÁPIDA - MIVOK (PowerShell)

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 VERIFICACIÓN DEL SISTEMA - MIVOK" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
node --version
Write-Host ""

# 2. Verificar npm
Write-Host "📦 Verificando npm..." -ForegroundColor Yellow
npm --version
Write-Host ""

# 3. Verificar dependencias instaladas
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "⚠️ node_modules no existe, ejecutando npm install..." -ForegroundColor Yellow
    npm install
}
Write-Host ""

# 4. ESLint
Write-Host "🔍 Ejecutando ESLint..." -ForegroundColor Yellow
npm run lint 2>&1 | Out-Null
$LINT_STATUS = $LASTEXITCODE
if ($LINT_STATUS -eq 0) {
    Write-Host "✅ ESLint: SIN ERRORES" -ForegroundColor Green
} else {
    Write-Host "⚠️ ESLint: Ejecutando..." -ForegroundColor Yellow
    npm run lint
}
Write-Host ""

# 5. TypeScript
Write-Host "🔍 Verificando TypeScript..." -ForegroundColor Yellow
npx tsc --noEmit 2>&1 | Out-Null
$TS_STATUS = $LASTEXITCODE
if ($TS_STATUS -eq 0) {
    Write-Host "✅ TypeScript: SIN ERRORES" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript: Hay errores" -ForegroundColor Red
}
Write-Host ""

# 6. Archivos críticos
Write-Host "📁 Verificando archivos críticos..." -ForegroundColor Yellow
$FILES = @(
    "lib/chat-functions.ts",
    "lib/profile-functions.ts",
    "app/chat.tsx",
    "app/buscar-djs.tsx",
    "app/editar-perfil.tsx"
)

foreach ($file in $FILES) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file NO ENCONTRADO" -ForegroundColor Red
    }
}
Write-Host ""

# 7. Documentación
Write-Host "📚 Verificando documentación..." -ForegroundColor Yellow
$DOCS = @(
    "INDICE_DOCUMENTACION.md",
    "RESUMEN_IMPLEMENTACION.md",
    "PERFIL_CHAT_GUIA.md",
    "PRUEBAS_SISTEMA_REAL.md",
    "ESTADO_FINAL.md"
)

foreach ($doc in $DOCS) {
    if (Test-Path $doc) {
        Write-Host "  ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $doc NO ENCONTRADO" -ForegroundColor Red
    }
}
Write-Host ""

# 8. Resumen
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ VERIFICACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. npm start         (iniciar dev server)" -ForegroundColor White
Write-Host "2. Seleccionar a/i/w (Android/iOS/Web)" -ForegroundColor White
Write-Host "3. Autenticarse      (Google/Microsoft/Facebook)" -ForegroundColor White
Write-Host "4. Probar features   (perfil, chat, notificaciones)" -ForegroundColor White
Write-Host ""

Write-Host "DOCUMENTACIÓN:" -ForegroundColor Cyan
Write-Host "👉 Empezar en: INDICE_DOCUMENTACION.md" -ForegroundColor Yellow
Write-Host ""

# 9. Líneas de código
Write-Host "📊 ESTADÍSTICAS DEL CÓDIGO:" -ForegroundColor Cyan
$totalLines = (Get-Content "lib/chat-functions.ts" -ErrorAction SilentlyContinue | Measure-Object -Line).Lines + 
              (Get-Content "lib/profile-functions.ts" -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
Write-Host "  Líneas de código nuevo: $totalLines" -ForegroundColor Yellow
Write-Host ""

Write-Host "✨ ¡LISTO PARA EMPEZAR!" -ForegroundColor Cyan
