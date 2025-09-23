// Free automated messaging via Telegram Bot
const TELEGRAM_BOT_TOKEN = 'your_bot_token_here';

export async function sendCredentialsViaTelegram(phoneNumber: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    // You need to create a Telegram bot first (@BotFather)
    // Users need to start the bot and provide their chat_id
    
    const message = `🏥 Veterinary Management System
    
Your login credentials:
📧 Email: ${email}
🔑 Password: ${password}
🌐 Login: ${window.location.origin}/login

Please change your password after first login.

Best regards,
Veterinary Management Team`;

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: phoneNumber, // Actually chat_id from Telegram
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (response.ok) {
      return {
        success: true,
        message: `Credentials sent via Telegram to ${phoneNumber}`
      };
    } else {
      throw new Error('Telegram API failed');
    }
  } catch (error) {
    console.error('Telegram failed:', error);
    return {
      success: false,
      message: 'Telegram service unavailable. Please share credentials manually.'
    };
  }
}