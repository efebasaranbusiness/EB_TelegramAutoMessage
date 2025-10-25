import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, phoneCode, password, apiId, apiHash } = await request.json();

    if (!phoneNumber || !phoneCode || !password) {
      return NextResponse.json(
        { error: 'Phone number, phone code, and password are required' },
        { status: 400 }
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

    // Verify password with Telegram
    const result = await telegramService.verifyPassword(phoneNumber, phoneCode, password);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        sessionString: result.sessionString,
        user: result.user
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Password verification failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verify password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
