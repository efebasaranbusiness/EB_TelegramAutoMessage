import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Return success for client-side handling
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Get scheduled message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    // Return success for client-side handling
    return NextResponse.json({ 
      success: true, 
      id,
      updates
    });
  } catch (error) {
    console.error('Update scheduled message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Return success for client-side handling
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete scheduled message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
