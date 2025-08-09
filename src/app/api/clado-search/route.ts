import { NextRequest, NextResponse } from 'next/server';

// Configuration - easily editable
const CLADO_API_KEY = process.env.CLADO_API_KEY || 'your-clado-api-key';
const CLADO_LIMIT = 30; // Edit this value as needed
const POLLING_INTERVAL = 30000; // 30 seconds

// Declare global type for results
declare global {
  var cladoResults: {
    searchId: string;
    jobId: string;
    query: string;
    timestamp: string;
    results: any;
  } | undefined;
}

interface CladoSearchRequest {
  query: string;
  limit?: number;
  hard_filter_company_urls?: string[];
}

interface CladoSearchResponse {
  job_id: string;
  status: string;
  message: string;
}

interface CladoStatusResponse {
  job_id: string;
  status: string;
  results?: any[];
  message?: string;
}

// Global state to track ongoing searches
const ongoingSearches = new Map<string, { jobId: string; query: string; startTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const body: CladoSearchRequest = await request.json();
    const { query, limit = CLADO_LIMIT, hard_filter_company_urls = [] } = body;

    console.log(`API request received. Query: ${query} limit: ${limit}`);

    // Initiate deep research with Clado
    const searchResponse = await fetch('https://search.clado.ai/api/search/deep_research', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLADO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
        hard_filter_company_urls,
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Clado API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to initiate Clado search' },
        { status: 500 }
      );
    }

    const searchData: CladoSearchResponse = await searchResponse.json();
    const { job_id, status } = searchData;

    // Store the search for polling
    const searchId = `search_${Date.now()}`;
    ongoingSearches.set(searchId, {
      jobId: job_id,
      query,
      startTime: Date.now(),
    });

    // Start polling in background (non-blocking)
    startPolling(searchId, job_id, query);

    return NextResponse.json({
      success: true,
      message: 'Deep research initiated successfully',
      search_id: searchId,
      job_id: job_id,
    });

  } catch (error) {
    console.error('Error in clado-search endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startPolling(searchId: string, jobId: string, query: string) {
  let checkCount = 0;
  
  const poll = async () => {
    checkCount++;
    console.log(`Status check ${checkCount} (every 30 sec): Checking job ${jobId}`);
    
    try {
      const statusResponse = await fetch(`https://search.clado.ai/api/search/deep_research/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${CLADO_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        console.error(`Status check ${checkCount}: Failed to get status`);
        return;
      }

      const statusData: CladoStatusResponse = await statusResponse.json();
      console.log(`Status check ${checkCount}: ${statusData.status}`);

      if (statusData.status === 'completed' || statusData.status === 'success') {
        console.log(`Status check ${checkCount}: SUCCESSFUL!`);
        console.log('Visit /api/results to look at the results');
        
        // Store results for the results endpoint
        global.cladoResults = {
          searchId,
          jobId,
          query,
          timestamp: new Date().toISOString(),
          results: statusData,
        };
        
        // Clean up
        ongoingSearches.delete(searchId);
        return;
      }

      // Continue polling if not completed
      setTimeout(poll, POLLING_INTERVAL);
      
    } catch (error) {
      console.error(`Status check ${checkCount} error:`, error);
      // Continue polling even on error
      setTimeout(poll, POLLING_INTERVAL);
    }
  };

  // Start polling after initial delay
  setTimeout(poll, POLLING_INTERVAL);
} 