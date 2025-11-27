**Mercado Pago — Setup de pruebas (sandbox) para Mivok**

Pasos rápidos para configurar pruebas locales sin exponer credenciales en GitHub:

1. Crear `secrets.local.ts` en la raíz del proyecto (ya hay `secrets.local.ts` de ejemplo).

   - Abre `/secrets.local.ts` y pega tu Access Token de prueba:

```ts
export const MP_ACCESS_TOKEN = 'TEST-5160688124204874-<tu-token-aqui>';
```

2. Asegúrate de que `secrets.local.ts` esté en `.gitignore` (ya está configurado) para no subir tus tokens.

3. Probar en la app:

   - En la app, ve a la pantalla `Pagar con Mercado Pago` (ruta: `/pago-mercadopago` o botón desde el chat).
   - Pulsa `Pagar con Mercado Pago`. La app creará una "preference" con el token de prueba.
   - El checkout se abre dentro de un WebView aislado dentro de la app (evita reutilizar tu sesión personal del navegador).

4. Usar cuentas y tarjetas de prueba:

   - Usuario comprador de prueba: `TESTUSER330557785022387793` / contraseña `AVPQ4IAzcB`
   - Usuario vendedor de prueba: `TESTUSER8646307446881291077` / contraseña `3n5W7zfLG2`
   - Tarjetas de prueba (Chile):
     - Visa: 4168 8188 4444 7115 - CVV 123 - 11/30 (usar nombre del titular "APRO" para transacción aprobada)
     - Mastercard: 5416 7526 0258 2580 - CVV 123

5. Notas y troubleshooting:

   - Si ves que el checkout usa tu cuenta personal, cierra sesión en el navegador o prueba desde el WebView (la app usa WebView aislado, pero es buena práctica cerrar sesión en Safari/Chrome antes).
   - Para producción debes usar credenciales reales y mover la creación de preferencias al servidor (no desde el cliente) por seguridad.
   - Si quieres que la app detecte el resultado automáticamente, deberías implementar deep links y usar `back_urls` que apunten a tu esquema (`mivokappproject://...`), y validar la preferencia desde tu servidor con la API de Mercado Pago.

Si quieres, pego yo tu token de prueba temporalmente en `secrets.local.ts` (solo en tu máquina), o te doy el comando que pegas en tu terminal para hacerlo por ti.
