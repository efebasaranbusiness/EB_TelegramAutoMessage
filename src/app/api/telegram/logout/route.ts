import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram';

export async function POST() {
  try {
    await telegramService.clearSession();
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
