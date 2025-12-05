// Servicio de emails con Resend - Diseños bonitos
// API Key: Configurar en variables de entorno o directo aquí para desarrollo

export interface EmailTemplate {
  type: 'welcome' | 'reset-password' | 'verification' | 'booking-confirmation';
  data: {
    userName?: string;
    resetCode?: string;
    resetLink?: string;
    eventDetails?: any;
    djName?: string;
  };
}

// API Key de Resend (configurada y lista para usar)
const RESEND_API_KEY = 're_H5BcYnB8_A6zVAGQ1mLbHQBWitzCH22zM';

// Plantilla de Email de Bienvenida 🎉
export const getWelcomeEmailHTML = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido a Mivok! 🎵</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 800;
        }
        .emoji { font-size: 48px; margin: 10px 0; }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 18px; 
            color: #333; 
            margin: 20px 0;
        }
        .feature-box {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            text-decoration: none;
            font-size: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🎵</div>
            <h1>¡Bienvenido a Mivok!</h1>
            <p>La plataforma que conecta DJs con eventos épicos</p>
        </div>
        
        <div class="content">
            <h2>¡Hola ${userName}! 👋</h2>
            <p class="welcome-text">
                ¡Nos emociona tenerte en nuestra comunidad musical! 🎉
                <br><br>
                Ahora puedes disfrutar de toda la magia de Mivok:
            </p>
            
            <div class="feature-box">
                <h3>🎧 Para Clientes</h3>
                <p>Encuentra DJs increíbles para tus eventos</p>
            </div>
            
            <div class="feature-box">
                <h3>🎤 Para DJs</h3>
                <p>Conecta con eventos y haz crecer tu carrera</p>
            </div>
            
            <a href="mivokapp://" class="cta-button">
                🚀 Abrir Mivok
            </a>
            
            <p style="margin-top: 30px; color: #666;">
                ¿Necesitas ayuda? Estamos aquí para ti 💜
            </p>
        </div>
        
        <div class="footer">
            <div class="social-links">
                <a href="#" style="color: #667eea;">📱</a>
                <a href="#" style="color: #f093fb;">💌</a>
                <a href="#" style="color: #764ba2;">🌟</a>
            </div>
            <p>© 2025 Mivok - Donde la música encuentra su lugar</p>
            <p style="font-size: 12px; color: #999;">
                Si no solicitaste esta cuenta, puedes ignorar este email.
            </p>
        </div>
    </div>
</body>
</html>
`;

// Plantilla de Reset Password 🔐
export const getResetPasswordEmailHTML = (userName: string, resetCode: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer Contraseña - Mivok 🔐</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 800;
        }
        .emoji { font-size: 48px; margin: 10px 0; }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .code-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            font-family: 'Courier New', monospace;
        }
        .warning-box {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            color: #856404;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🔐</div>
            <h1>Restablecer Contraseña</h1>
            <p>Recupera el acceso a tu cuenta Mivok</p>
        </div>
        
        <div class="content">
            <h2>¡Hola ${userName}! 👋</h2>
            <p>
                Recibimos una solicitud para restablecer tu contraseña.
                <br><br>
                Usa este código para continuar:
            </p>
            
            <div class="code-box">
                ${resetCode}
            </div>
            
            <div class="warning-box">
                <strong>⏰ Este código expira en 15 minutos</strong>
                <br>
                Por seguridad, úsalo lo antes posible.
            </div>
            
            <a href="mivokapp://reset-password?code=${resetCode}" class="cta-button">
                🚀 Restablecer Ahora
            </a>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Si no solicitaste esto, ignora este email. 
                Tu cuenta permanece segura.
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 Mivok - Tu música, tu seguridad</p>
            <p style="font-size: 12px; color: #999;">
                Este es un email automático, no respondas a esta dirección.
            </p>
        </div>
    </div>
</body>
</html>
`;

// Plantilla de Confirmación de Booking 🎉
export const getBookingConfirmationHTML = (clientName: string, djName: string, eventDetails: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Booking Confirmado! 🎉 - Mivok</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            padding: 40px 20px; 
            text-align: center; 
            color: #333;
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 800;
        }
        .emoji { font-size: 60px; margin: 10px 0; }
        .content { padding: 40px 30px; }
        .event-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        .event-detail {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .celebration {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            color: #333;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 10px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🎉</div>
            <h1>¡Booking Confirmado!</h1>
            <p>Tu evento está listo para ser épico</p>
        </div>
        
        <div class="content">
            <h2>¡Felicidades ${clientName}! 🥳</h2>
            
            <div class="celebration">
                🎵 🎤 🎧 🎶 💫
            </div>
            
            <p style="text-align: center; font-size: 18px;">
                Tu booking con <strong>${djName}</strong> ha sido confirmado.
                <br>¡Prepárate para una noche inolvidable!
            </p>
            
            <div class="event-card">
                <h3>📋 Detalles del Evento</h3>
                <div class="event-detail">
                    <span>🎤 DJ:</span>
                    <span><strong>${djName}</strong></span>
                </div>
                <div class="event-detail">
                    <span>📅 Fecha:</span>
                    <span><strong>${eventDetails.fecha}</strong></span>
                </div>
                <div class="event-detail">
                    <span>⏰ Hora:</span>
                    <span><strong>${eventDetails.hora}</strong></span>
                </div>
                <div class="event-detail">
                    <span>📍 Lugar:</span>
                    <span><strong>${eventDetails.lugar}</strong></span>
                </div>
                <div class="event-detail">
                    <span>💰 Total:</span>
                    <span><strong>$${eventDetails.precio?.toLocaleString('es-CL')}</strong></span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="mivokapp://events" class="cta-button">
                    📱 Ver en App
                </a>
                <a href="mivokapp://chat/${eventDetails.djId}" class="cta-button">
                    💬 Chat con DJ
                </a>
            </div>
            
            <p style="margin-top: 30px; color: #666; text-align: center;">
                ¿Preguntas? Contacta a tu DJ directamente por la app 💜
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 Mivok - Creando momentos memorables</p>
            <p style="font-size: 12px; color: #999;">
                Guarda este email como comprobante de tu booking.
            </p>
        </div>
    </div>
</body>
</html>
`;

// Función principal para enviar emails
export const sendEmail = async (
  to: string, 
  subject: string, 
  template: EmailTemplate
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    let htmlContent = '';
    
    // Seleccionar plantilla según el tipo
    switch (template.type) {
      case 'welcome':
        htmlContent = getWelcomeEmailHTML(template.data.userName || 'Usuario');
        break;
      case 'reset-password':
        htmlContent = getResetPasswordEmailHTML(
          template.data.userName || 'Usuario',
          template.data.resetCode || '123456'
        );
        break;
      case 'booking-confirmation':
        htmlContent = getBookingConfirmationHTML(
          template.data.userName || 'Cliente',
          template.data.djName || 'DJ',
          template.data.eventDetails || {}
        );
        break;
      default:
        throw new Error('Tipo de plantilla no válido');
    }

    // Usar la API real de Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mivok <onboarding@resend.dev>', // Usando el dominio por defecto de Resend
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      // Silenciar errores en desarrollo por limitaciones de Resend
      throw new Error(`Error ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    console.log('✅ Email enviado exitosamente con Resend:', result.id);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

// Funciones de conveniencia
export const sendWelcomeEmail = async (email: string, userName: string) => {
  return sendEmail(email, '🎵 ¡Bienvenido a Mivok!', {
    type: 'welcome',
    data: { userName }
  });
};

export const sendPasswordResetEmail = async (email: string, userName: string, resetCode: string) => {
  return sendEmail(email, '🔐 Restablecer tu contraseña - Mivok', {
    type: 'reset-password',
    data: { userName, resetCode }
  });
};

export const sendBookingConfirmationEmail = async (
  email: string, 
  clientName: string, 
  djName: string, 
  eventDetails: any
) => {
  return sendEmail(email, '🎉 ¡Booking confirmado! Tu evento está listo', {
    type: 'booking-confirmation',
    data: { userName: clientName, djName, eventDetails }
  });
};