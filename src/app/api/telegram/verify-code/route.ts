import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, phoneCode, password, apiId, apiHash } = await request.json();

    if (!phoneNumber || !phoneCode) {
      return NextResponse.json(
        { error: 'Phone number and phone code are required' },
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

    // Verify phone code with Telegram
    const result = await telegramService.verifyPhoneCode(phoneNumber, phoneCode);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        sessionString: result.sessionString,
        user: result.user
      });
    } else if (result.requiresPassword) {
      return NextResponse.json({
        success: false,
        requiresPassword: true,
        error: '2FA password required'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
