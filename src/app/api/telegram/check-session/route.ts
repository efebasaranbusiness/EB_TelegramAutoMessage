import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    // Get API credentials from query parameters
    const { searchParams } = new URL(request.url);
    const apiId = searchParams.get('apiId');
    const apiHash = searchParams.get('apiHash');

    if (!apiId || !apiHash) {
      return NextResponse.json(
        { success: false, error: 'API credentials are required' },
        { status: 400 }
      );
    }

    // Set configuration for this request
    telegramService.setConfiguration(parseInt(apiId), apiHash);

    const result = await telegramService.checkExistingSession();
    
    if (result.hasSession && result.user) {
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: result.user,
        sessionString: result.sessionString
      });
    } else {
      return NextResponse.json({
        success: true,
        hasSession: false
      });
    }
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
}
