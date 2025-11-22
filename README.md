# Mivok - Beta

Aplicación móvil para conectar DJs con clientes de eventos.

## Estado del Proyecto

**Versión:** 1.0.0-beta  
Esta es una versión beta en desarrollo. No está lista para lanzamiento a App Store o Play Store.

## Inicio Rápido

```bash
npm install
npm start        # Inicia en web (no requiere autenticación del sistema)
npm run start:all # Inicia con todas las opciones (puede pedir permisos del sistema)
npm run android   # Inicia en Android
npm run ios       # Inicia en iOS (puede pedir permisos del sistema macOS)
npm run web       # Inicia en web
```

## Nota sobre Permisos del Sistema

Si ejecutas `npm run ios` o `npm run start:all`, macOS puede pedirte autenticación (huella/contraseña) para `xcodebuild`. Esto es normal y es una medida de seguridad del sistema operativo. Solo necesitas autorizarlo una vez.

Para evitar esto, usa `npm start` que inicia directamente en web sin requerir permisos del sistema.
