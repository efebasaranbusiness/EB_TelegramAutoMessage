import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return empty array since cron manager is now client-side
    return NextResponse.json({ scheduledMessages: [] });
  } catch (error) {
    console.error('Get scheduled messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, cronExpression } = await request.json();

    if (!chatId || !message || !cronExpression) {
      return NextResponse.json(
        { error: 'Chat ID, message, and cron expression are required' },
        { status: 400 }
      );
    }

    const scheduledMessage = {
      id: Date.now().toString(),
      chatId,
      message,
      cronExpression,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Return the scheduled message for client-side handling
    return NextResponse.json({ 
      success: true, 
      scheduledMessage 
    });
  } catch (error) {
    console.error('Schedule message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
