Mercado Pago — Microserver para crear preferences (sandbox)

Este microservicio facilita crear "preferences" en Mercado Pago sin exponer el `ACCESS_TOKEN` en el cliente.

NUEVO: Fallback MOCK
- Si Mercado Pago devuelve 403 por políticas (PA_UNAUTHORIZED_RESULT_FROM_POLICIES) puedes activar un fallback local para pruebas sin llamar a la API real.
- Para activar el mock exporta la variable `USE_MOCK=true` al arrancar el servidor.

1) Instalación

```bash
cd server
npm install
```

2) Configuración

Copia el archivo de ejemplo y añade tu token sandbox (éste lo tienes en `secrets.local.ts`):

```bash
cp .env.example .env
# Edita .env y pega MP_ACCESS_TOKEN (sandbox) que ya tienes
```

O ejecuta el servidor con la variable en línea (temporal):

```bash
MP_ACCESS_TOKEN=TEST-5160688124204874-xxxxxxxx node index.js
```

3) Ejecutar

```bash
# Modo normal (usa Mercado Pago)
npm start

# Modo mock (si Mercado Pago bloquee tu token por políticas y quieres probar la app)
# En zsh / macOS:
USE_MOCK=true npm start
# o:
USE_MOCK=true node index.js
```

El servidor estará disponible en `http://localhost:3000` por defecto y expondrá la ruta POST `/create_preference`.

4) Cliente (app)

- El cliente `app/pago-mercadopago.tsx` ya está preparado para llamar a `MP_SERVER_URL` definido en `secrets.local.ts`.
- Para emulador Android, usa `http://10.0.2.2:3000` en `MP_SERVER_URL`.
- Para iOS simulator o web, `http://localhost:3000` funciona.

5) Flujo de pruebas

- Inicia el servidor y la app.
- Desde la app, genera un pago en `/pago-mercadopago`.
- El servidor crea la preference en Mercado Pago (sandbox) y devuelve la data al cliente.
- El cliente abre `sandbox_init_point`/`init_point` en el WebView para completar el checkout.

6) Producción

- Nunca uses `MP_ACCESS_TOKEN` en el cliente.
- Implementa validación en el servidor y webhooks para confirmar pagos automáticamente.

