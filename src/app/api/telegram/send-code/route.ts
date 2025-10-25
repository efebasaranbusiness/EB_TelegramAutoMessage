import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, apiId, apiHash } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Initialize Telegram client
    const initialized = await telegramService.initialize();
    if (!initialized) {
      return NextResponse.json(
        { error: 'Failed to initialize Telegram client' },
        { status: 500 }
      );
    }

    // Send phone number to Telegram
    const result = await telegramService.sendPhoneNumber(phoneNumber);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
