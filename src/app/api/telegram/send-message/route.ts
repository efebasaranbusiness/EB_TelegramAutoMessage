import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json();
    const sessionString = request.headers.get('x-session-string');
    const apiId = request.headers.get('x-api-id');
    const apiHash = request.headers.get('x-api-hash');
    
    if (!sessionString) {
      console.error('Session string is missing in request headers');
      return NextResponse.json(
        { error: 'Session string is required' },
        { status: 401 }
      );
    }

    console.log('Received session string length:', sessionString.length);

    if (!apiId || !apiHash) {
      return NextResponse.json(
        { error: 'API credentials are required' },
        { status: 400 }
      );
    }

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Chat ID and message are required' },
        { status: 400 }
      );
    }

    // Set configuration for this request
    telegramService.setConfiguration(parseInt(apiId), apiHash);

    // Initialize Telegram client with session
    const initialized = await telegramService.initialize(sessionString);
    if (!initialized) {
      return NextResponse.json(
        { error: 'Failed to initialize Telegram client' },
        { status: 500 }
      );
    }

    const success = await telegramService.sendMessage(chatId, message);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      console.error('Telegram sendMessage returned false');
      console.error('Chat ID:', chatId);
      console.error('Message:', message);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
