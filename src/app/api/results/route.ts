import { NextResponse } from 'next/server';

// Import the latestResults from the clado-search module
// Note: In a production app, you'd want to use a proper data store like Redis
// For testing purposes, we'll access the same global variable

// Re-declare the global variable here (it's shared across the Node.js process)
declare global {
  var latestCladoResults: any;
}

export async function GET() {
  try {
    // Check if we have any results
    if (!global.latestCladoResults) {
      return NextResponse.json({
        message: 'No results available yet. Please initiate a search first.',
        results: null
      });
    }

    // Return the entire raw JSON
    return NextResponse.json(global.latestCladoResults);

  } catch (error) {
    console.error('Results endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}