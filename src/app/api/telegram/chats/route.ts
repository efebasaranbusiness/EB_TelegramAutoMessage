import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    const sessionString = request.headers.get('x-session-string');
    const apiId = request.headers.get('x-api-id');
    const apiHash = request.headers.get('x-api-hash');
    
    if (!sessionString) {
      return NextResponse.json(
        { error: 'Session string is required' },
        { status: 401 }
      );
    }

    if (!apiId || !apiHash) {
      return NextResponse.json(
        { error: 'API credentials are required' },
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

    const chats = await telegramService.getChats();
    
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
