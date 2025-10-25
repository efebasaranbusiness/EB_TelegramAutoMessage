import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    const sessionString = request.headers.get('x-session-string');
    
    if (!sessionString) {
      return NextResponse.json(
        { error: 'Session string is required' },
        { status: 401 }
      );
    }

    // Initialize Telegram client with session
    const initialized = await telegramService.initialize(sessionString);
    if (!initialized) {
      return NextResponse.json(
        { error: 'Failed to initialize Telegram client' },
        { status: 500 }
      );
    }

    const user = await telegramService.getCurrentUser();
    
    if (user) {
      return NextResponse.json({ user });
    } else {
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
