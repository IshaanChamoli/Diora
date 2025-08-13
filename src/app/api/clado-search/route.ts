import { NextRequest, NextResponse } from 'next/server';

// Global variable to store the latest successful results
declare global {
  var latestCladoResults: any;
}

// Initialize global variable if it doesn't exist
if (!global.latestCladoResults) {
  global.latestCladoResults = null;
}

// Global variable to store current polling interval
let currentPollingInterval: NodeJS.Timeout | null = null;

// Global variable to store current query text
let currentQueryText: string | null = null;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body;
    let search_query;
    
    try {
      body = JSON.parse(rawBody);
      
      // Check if this is a VAPI tool call format
      if (body.message?.toolCalls?.[0]?.function?.name === 'expert_search') {
        const vapiQuery = body.message.toolCalls[0].function.arguments.search_query;
        console.log(`Expert search request received with query: ${vapiQuery}`);
        search_query = vapiQuery;
      } else {
        // Handle direct API calls (like curl)
        search_query = body.search_query;
        if (search_query) {
          console.log(`Direct search request received with query: ${search_query}`);
        }
      }
    } catch (parseError) {
      console.log('Body is not valid JSON:', parseError);
      body = {};
    }

    if (!search_query) {
      return NextResponse.json(
        { error: 'search_query is required' },
        { status: 400 }
      );
    }

    // Get Clado API key from environment
    const cladoApiKey = process.env.CLADO_API_KEY;
    if (!cladoApiKey) {
      return NextResponse.json(
        { error: 'Clado API key not configured' },
        { status: 500 }
      );
    }

    console.log(`Initiating Clado search for query: ${search_query}`);

    // Initiate the deep research
    const initiateResponse = await fetch('https://search.clado.ai/api/search/deep_research', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cladoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: search_query,
        limit: 30
      }),
    });

    if (!initiateResponse.ok) {
      const errorText = await initiateResponse.text();
      console.error('Clado initiate search failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to initiate Clado search', details: errorText },
        { status: initiateResponse.status }
      );
    }

    const initiateData = await initiateResponse.json();
    const searchId = initiateData.job_id;

    if (!searchId) {
      return NextResponse.json(
        { error: 'No search ID returned from Clado' },
        { status: 500 }
      );
    }

    console.log(`Clado search initiated with ID: ${searchId}`);

    // Store the query text for later inclusion in results
    currentQueryText = search_query;

    // Start background polling
    startPolling(searchId, cladoApiKey);

    // Return success immediately
    return NextResponse.json({
      success: true,
      message: 'Search initiated successfully',
      search_id: searchId
    });

  } catch (error) {
    console.error('Clado search endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function startPolling(searchId: string, apiKey: string) {
  // Clear any existing polling
  if (currentPollingInterval) {
    clearInterval(currentPollingInterval);
  }

  console.log(`Starting polling for search ID: ${searchId}`);
  let checkNumber = 0;

  currentPollingInterval = setInterval(async () => {
    try {
      checkNumber++;
      console.log(`Polling status check ${checkNumber} (every 30 sec) for search ID: ${searchId}`);

      const statusResponse = await fetch(`https://search.clado.ai/api/search/deep_research/${searchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        console.error(`Status check failed for ${searchId}:`, await statusResponse.text());
        return;
      }

      const statusData = await statusResponse.json();
      console.log(`Status for ${searchId}:`, statusData.status);

      // Check if search is successful according to docs
      if (statusData.status === 'completed' || statusData.status === 'success') {
        console.log(`Search ${searchId} completed successfully!`);
        
        // Store the results in global variable with query text on top
        global.latestCladoResults = {
          query: currentQueryText,
          ...statusData
        };
        
        // Stop polling
        if (currentPollingInterval) {
          clearInterval(currentPollingInterval);
          currentPollingInterval = null;
        }
        
        console.log('Polling stopped. Results stored.');
      } else if (statusData.status === 'failed' || statusData.status === 'error') {
        console.error(`Search ${searchId} failed:`, statusData);
        
        // Stop polling on failure
        if (currentPollingInterval) {
          clearInterval(currentPollingInterval);
          currentPollingInterval = null;
        }
      }
      // Continue polling for other statuses like 'processing', 'pending', etc.

    } catch (error) {
      console.error(`Error polling status for ${searchId}:`, error);
    }
  }, 30000); // Poll every 30 seconds
}