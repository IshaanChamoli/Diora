import { NextRequest, NextResponse } from 'next/server';
import { autoCreateProjectFromCall } from '@/lib/projectUtils';
import { createClient } from '@supabase/supabase-js';

interface VapiCall {
  id: string;
  assistantId: string;
  assistantOverrides?: {
    variableValues?: {
      first_name?: string;
    };
  };
  createdAt: string;
  endedAt?: string;
  status: string;
  transcript?: string;
  messages?: Array<{
    role: string;
    message?: string;
    content?: string;
  }>;
}

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { first_name, assistant_type } = await request.json();
    
    console.log('🔍 Fetching Vapi calls for:', { first_name, assistant_type });
    
    // Get Vapi PRIVATE API key from environment (not the public key used for client-side)
    const vapiApiKey = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY;
    if (!vapiApiKey) {
      return NextResponse.json(
        { error: 'Vapi private API key not configured' },
        { status: 500 }
      );
    }
    
    // Get the assistant ID based on type
    let assistantId: string;
    if (assistant_type === 'dashboard') {
      assistantId = process.env.NEXT_PUBLIC_VAPI_DASHBOARD_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_QUESTIONS_ASSISTANT_ID || '';
    } else {
      assistantId = process.env.NEXT_PUBLIC_VAPI_QUESTIONS_ASSISTANT_ID || '';
    }
    
    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID not configured' },
        { status: 500 }
      );
    }
    
    console.log('🤖 Using assistant ID:', assistantId);
    
    // Fetch calls from Vapi API - Simple approach with just limit
    const vapiUrl = new URL('https://api.vapi.ai/call');
    vapiUrl.searchParams.append('limit', '10'); // Get 10 most recent calls
    
    console.log('📡 Fetching from URL:', vapiUrl.toString());
    
    const response = await fetch(vapiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Vapi API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch calls from Vapi', details: errorText },
        { status: response.status }
      );
    }
    
    const calls = await response.json();
    // console.log('📞 Raw calls response:', calls); // Removed to reduce clutter
    
    // Filter calls by assistant ID and first_name
    let filteredCalls = calls;
    if (Array.isArray(calls) && calls.length > 0) {
      console.log(`📊 Total calls received: ${calls.length}`);
      
      // First filter by assistant ID (client-side since API doesn't accept assistantId param)
      filteredCalls = calls.filter(call => call.assistantId === assistantId);
      console.log(`🤖 Calls matching assistant ID: ${filteredCalls.length}`);
      
      // Then filter by first_name in assistantOverrides.variableValues
      filteredCalls = filteredCalls.filter((call: VapiCall) => {
        const variableValues = call.assistantOverrides?.variableValues;
        const matchesName = variableValues?.first_name === first_name;
        if (matchesName) {
          console.log(`✅ Found matching call: ${call.id} with first_name: ${variableValues?.first_name}`);
        }
        return matchesName;
      });
      
      console.log(`🔍 Found ${filteredCalls.length} calls matching first_name: ${first_name}`);
      
      // Calls are already in reverse chronological order (most recent first) from API
      // No need to sort since API returns them newest first
    }
    
    // Get the latest call (first in the array - most recent)
    const latestCall = Array.isArray(filteredCalls) && filteredCalls.length > 0 ? filteredCalls[0] : null;
    
    if (latestCall) {
      console.log('✅ Latest call found:', {
        id: latestCall.id,
        createdAt: latestCall.createdAt,
        status: latestCall.status,
        duration: latestCall.endedAt ? 
          ((new Date(latestCall.endedAt).getTime() - new Date(latestCall.createdAt).getTime()) / 1000) + ' seconds' : 
          'ongoing'
      });
      
      // Log transcript if available
      if (latestCall.transcript) {
        console.log('📝 Call Transcript:');
        console.log('==================');
        console.log(latestCall.transcript);
        console.log('==================');
      } else {
        console.log('📝 No transcript available yet');
      }
      
      // Log messages if available (skip system message at index 0)
      if (latestCall.messages && latestCall.messages.length > 1) {
        console.log('💬 Call Messages:');
        console.log('==================');
        latestCall.messages.slice(1).forEach((message: {role: string; message?: string; content?: string}, index: number) => {
          console.log(`${index + 1}. [${message.role}]: ${message.message || message.content}`);
        });
        console.log('==================');
      }
      
    } else {
      console.log('❌ No calls found');
    }
    
    // Prepare response data
    let projectCreated = null;
    
    // Auto-create project from call transcript
    if (latestCall?.transcript) {
      console.log('🚀 Auto-creating project from call transcript...');
      
      // Get user ID from first_name (find user in investors table)
      const { data: investor, error: investorError } = await supabase
        .from('investors')
        .select('id')
        .eq('first_name', first_name)
        .single();
        
      if (investorError || !investor) {
        console.error('❌ Could not find user with first_name:', first_name, investorError);
      } else {
        // Create project using the transcript
        const projectResult = await autoCreateProjectFromCall(latestCall.transcript, investor.id);
        
        if (projectResult.success && projectResult.project) {
          console.log('✅ Project auto-created successfully:', {
            name: projectResult.project.name,
            slug: projectResult.project.slug,
            id: projectResult.project.id
          });
          
          projectCreated = projectResult.project;
          console.log('📡 Broadcasting project creation event...');
        } else {
          console.error('❌ Failed to auto-create project:', projectResult.error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      latestCall,
      totalCalls: Array.isArray(filteredCalls) ? filteredCalls.length : 1,
      filteredBy: { first_name, assistant_type, assistantId },
      projectCreated: projectCreated ? {
        id: projectCreated.id,
        name: projectCreated.name,
        slug: projectCreated.slug,
        description: projectCreated.description,
        questions: projectCreated.questions,
        questions_done: projectCreated.questions_done
      } : null,
      expertSearchQuery: projectCreated ? (projectCreated as any).expertSearchQuery : null
    });
    
  } catch (error) {
    console.error('❌ Vapi calls endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}