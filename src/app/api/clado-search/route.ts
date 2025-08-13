import { NextRequest, NextResponse } from 'next/server';

// Map-based storage for concurrent searches - each call gets its own "folder"
const searchResults = new Map<string, any>();           // call-id → clado results
const pollingIntervals = new Map<string, NodeJS.Timeout>(); // call-id → polling timer  
const queryTexts = new Map<string, string>();           // call-id → original query
const jobIds = new Map<string, string>();               // call-id → clado job id
const userNames = new Map<string, string>();            // call-id → user first name
const projectIds = new Map<string, string>();           // call-id → project id

// Keep global for /api/results testing endpoint (will be last completed search)
declare global {
  var latestCladoResults: any;
}

if (!global.latestCladoResults) {
  global.latestCladoResults = null;
}

export async function POST(request: NextRequest) {
  try {
    // Get unique call identifier for this search
    const callId = request.headers.get('x-call-id') || `direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const rawBody = await request.text();
    let body;
    let search_query;
    let userFirstName = null;
    let projectId = null;
    
    try {
      body = JSON.parse(rawBody);
      
      // Check if this is a VAPI tool call format
      if (body.message?.toolCalls?.[0]?.function?.name === 'expert_search') {
        const vapiQuery = body.message.toolCalls[0].function.arguments.search_query;
        
        // Extract user data from VAPI payload - CORRECT PATH (assistant object)!
        userFirstName = body.message?.assistant?.variableValues?.first_name || null;
        projectId = body.message?.assistant?.variableValues?.project_id || null;
        
        console.log(`Expert search request received with query: ${vapiQuery} [Call ID: ${callId}] [User: ${userFirstName}] [Project ID: ${projectId}]`);
        search_query = vapiQuery;
      } else {
        // Handle direct API calls (like curl)
        search_query = body.search_query;
        if (search_query) {
          console.log(`Direct search request received with query: ${search_query} [Call ID: ${callId}]`);
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

    console.log(`Clado search initiated with ID: ${searchId} [Call ID: ${callId}]`);

    // Store search data in Maps for this specific call
    queryTexts.set(callId, search_query);
    jobIds.set(callId, searchId);
    if (userFirstName) userNames.set(callId, userFirstName);
    if (projectId) projectIds.set(callId, projectId);

    // Start background polling for this specific call
    startPolling(searchId, cladoApiKey, callId);

    // Return success immediately
    return NextResponse.json({
      success: true,
      message: 'Search initiated successfully',
      search_id: searchId,
      call_id: callId
    });

  } catch (error) {
    console.error('Clado search endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function startPolling(searchId: string, apiKey: string, callId: string) {
  // Clear any existing polling for THIS specific call (in case of restart)
  const existingInterval = pollingIntervals.get(callId);
  if (existingInterval) {
    clearInterval(existingInterval);
    pollingIntervals.delete(callId);
  }

  console.log(`Starting polling for search ID: ${searchId} [Call ID: ${callId}]`);
  let checkNumber = 0;

  const pollingInterval = setInterval(async () => {
    try {
      checkNumber++;
      console.log(`Polling status check ${checkNumber} (every 30 sec) for search ID: ${searchId} [Call ID: ${callId}]`);

      const statusResponse = await fetch(`https://search.clado.ai/api/search/deep_research/${searchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        console.error(`Status check failed for ${searchId} [Call ID: ${callId}]:`, await statusResponse.text());
        return;
      }

      const statusData = await statusResponse.json();
      console.log(`Status for ${searchId} [Call ID: ${callId}]:`, statusData.status);

      // Check if search is successful according to docs
      if (statusData.status === 'completed' || statusData.status === 'success') {
        console.log(`Search ${searchId} completed successfully! [Call ID: ${callId}]`);
        
        // Store the results for this specific call with all context data on top
        const queryText = queryTexts.get(callId);
        const userName = userNames.get(callId);
        const projectId = projectIds.get(callId);
        
        console.log(`🔍 DEBUG - Building results for ${callId}:`);
        console.log(`  - queryText: ${queryText}`);
        console.log(`  - userName: ${userName}`);
        console.log(`  - projectId: ${projectId}`);
        
        const resultsWithContext = {
          query: queryText,
          user_name: userName,
          project_id: projectId,
          call_id: callId,
          ...statusData
        };
        
        searchResults.set(callId, resultsWithContext);
        
        // Also update global for testing endpoint (will be latest completed search)
        global.latestCladoResults = resultsWithContext;
        
        // Stop polling for this specific call
        const intervalToStop = pollingIntervals.get(callId);
        if (intervalToStop) {
          clearInterval(intervalToStop);
          pollingIntervals.delete(callId);
        }
        
        console.log(`Polling stopped for Call ID: ${callId}. Results stored.`);
        
        // TODO: Phase 3 - Here we'll add code to save experts to database
        
      } else if (statusData.status === 'failed' || statusData.status === 'error') {
        console.error(`Search ${searchId} failed [Call ID: ${callId}]:`, statusData);
        
        // Stop polling on failure for this specific call
        const intervalToStop = pollingIntervals.get(callId);
        if (intervalToStop) {
          clearInterval(intervalToStop);
          pollingIntervals.delete(callId);
        }
        
        // Clean up data for failed search
        searchResults.delete(callId);
        queryTexts.delete(callId);
        jobIds.delete(callId);
        userNames.delete(callId);
        projectIds.delete(callId);
      }
      // Continue polling for other statuses like 'processing', 'pending', etc.

    } catch (error) {
      console.error(`Error polling status for ${searchId} [Call ID: ${callId}]:`, error);
    }
  }, 30000); // Poll every 30 seconds
  
  // Store the polling interval for this specific call
  pollingIntervals.set(callId, pollingInterval);
}