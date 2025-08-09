import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!global.cladoResults) {
      return NextResponse.json(
        { error: 'No results available. Start a search first.' },
        { status: 404 }
      );
    }

    // Return the full results as plain JSON
    return NextResponse.json(global.cladoResults, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in results endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 