import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    
    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "start" or "stop"' },
        { status: 400 }
      );
    }

    // Return success for client-side handling
    return NextResponse.json({ 
      success: true, 
      id,
      action
    });
  } catch (error) {
    console.error('Toggle scheduled message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
