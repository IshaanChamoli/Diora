import { supabase } from './supabase';
import { analyzeTranscript } from './openai';

export interface CreateProjectParams {
  name: string;
  description: string;
  questions?: string[];
  userId: string;
  questions_done?: boolean;
}

export interface ProjectCreationResult {
  success: boolean;
  project?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    questions: string[];
    questions_done: boolean;
  };
  error?: string;
  expertSearchQuery?: string;
}

// Generate clean slug from project name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Generate unique project name for auto-creation
export function generateTestProjectName(): string {
  const randomNumber = Math.floor(Math.random() * 1000000000000); // 12-digit random number
  return `test-${randomNumber}`;
}

// Import the clado search logic and reuse existing functionality
async function triggerExpertSearchServerSide(searchQuery: string, projectId: string): Promise<void> {
  // Create a fake request object to reuse the existing clado-search POST logic
  const callId = `auto-${projectId}-${Date.now()}`;
  
  console.log(`🔍 Auto-triggering expert search for project ${projectId} with query: "${searchQuery}" [Call ID: ${callId}]`);

  const cladoApiKey = process.env.CLADO_API_KEY;
  if (!cladoApiKey) {
    throw new Error('Clado API key not configured');
  }

  console.log(`Initiating Clado search for query: ${searchQuery}`);

  // Initiate the deep research (same as clado-search route)
  const initiateResponse = await fetch('https://search.clado.ai/api/search/deep_research', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cladoApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: searchQuery,
      limit: 30
    }),
  });

  if (!initiateResponse.ok) {
    const errorText = await initiateResponse.text();
    console.error('Clado initiate search failed:', errorText);
    throw new Error(`Failed to initiate Clado search: ${errorText}`);
  }

  const initiateData = await initiateResponse.json();
  const searchId = initiateData.job_id;

  if (!searchId) {
    throw new Error('No search ID returned from Clado');
  }

  console.log(`Clado search initiated with ID: ${searchId} [Call ID: ${callId}]`);

  // Start background polling (same as clado-search route)
  startBackgroundPolling(searchId, cladoApiKey, callId, searchQuery, projectId);
}

// Background polling function (mirrors clado-search route logic)
function startBackgroundPolling(searchId: string, apiKey: string, callId: string, queryText: string, projectId: string) {
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

      // Check if search is successful
      if (statusData.status === 'completed' || statusData.status === 'success') {
        console.log(`Search ${searchId} completed successfully! [Call ID: ${callId}]`);
        
        // Save experts to database
        await saveExpertsToDatabase(statusData, projectId, queryText);
        
        // Stop polling
        clearInterval(pollingInterval);
        console.log(`Polling stopped for Call ID: ${callId}. Results stored.`);
        
      } else if (statusData.status === 'failed' || statusData.status === 'error') {
        console.error(`Search ${searchId} failed [Call ID: ${callId}]:`, statusData);
        clearInterval(pollingInterval);
      }

    } catch (error) {
      console.error(`Error polling status for ${searchId} [Call ID: ${callId}]:`, error);
    }
  }, 30000); // Poll every 30 seconds
}

// Save experts to database (same as clado-search route)
async function saveExpertsToDatabase(results: any, projectId: string, query: string) {
  if (!results.results || !Array.isArray(results.results)) {
    console.log('No experts found in results to save');
    return;
  }

  console.log(`💾 Saving ${results.results.length} experts to database for project ${projectId}`);
  console.log(`📊 Experts will be ranked 1-${results.results.length} based on Clado's result order`);

  const expertsToInsert = results.results.map((result: any, index: number) => {
    const profile = result.profile;
    
    // Extract reasoning from all criteria
    let reasoning = '';
    if (profile.criteria) {
      const reasoningParts = [];
      for (const criteriaKey in profile.criteria) {
        const criteria = profile.criteria[criteriaKey];
        if (criteria.reasoning) {
          reasoningParts.push(criteria.reasoning);
        }
      }
      reasoning = reasoningParts.join('\n\n');
    }

    // Preserve exact JSON format
    const preservedJson = JSON.parse(JSON.stringify(result));

    return {
      name: profile.name || '',
      project_id: projectId,
      linkedin_url: profile.linkedin_profile_url || profile.linkedin_url || '',
      headline: profile.headline || '',
      summary: profile.summary || '',
      reasoning: reasoning,
      for_query: query,
      rank: index + 1,
      raw_json: preservedJson
    };
  });

  try {
    const { data, error } = await supabase
      .from('experts')
      .insert(expertsToInsert)
      .select();

    if (error) {
      console.error('❌ Error saving experts to database:', error);
    } else {
      console.log(`✅ Successfully saved ${data.length} experts to database with ranks 1-${data.length}`);
      console.log(`🔗 Query: "${query}" | Project: ${projectId}`);
    }
  } catch (error) {
    console.error('❌ Exception saving experts to database:', error);
  }
}


// Create a new project in the database
export async function createProject(params: CreateProjectParams): Promise<ProjectCreationResult> {
  try {
    const slug = generateSlug(params.name);
    
    // Check if project with same slug already exists for this user
    const { data: existingProject } = await supabase
      .from('projects')
      .select('name')
      .eq('slug', slug)
      .eq('investor_id', params.userId)
      .single();

    if (existingProject) {
      return {
        success: false,
        error: `A project named "${existingProject.name}" already exists`
      };
    }

    // Create project in database
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: params.name,
        slug: slug,
        description: params.description,
        questions: params.questions || [],
        investor_id: params.userId,
        questions_done: params.questions_done || false
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Project creation error:', projectError);
      return {
        success: false,
        error: 'Failed to create project'
      };
    }

    console.log('✅ Project created successfully:', {
      id: project.id,
      name: project.name,
      slug: project.slug
    });

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        questions: project.questions,
        questions_done: project.questions_done
      }
    };

  } catch (error) {
    console.error('❌ Exception creating project:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

// Auto-create project from Vapi call transcript using AI analysis
export async function autoCreateProjectFromCall(
  transcript: string, 
  userId: string
): Promise<ProjectCreationResult> {
  try {
    console.log('🤖 Analyzing transcript with AI...');
    
    // Use AI to analyze the transcript and generate project content
    const analysis = await analyzeTranscript(transcript);
    
    console.log('✅ AI analysis complete:', {
      title: analysis.project_title,
      description: analysis.project_description.substring(0, 100) + '...',
      questionsCount: analysis.questions.length,
      expertSearchQuery: analysis.expert_search_query
    });
    
    const projectResult = await createProject({
      name: analysis.project_title,
      description: analysis.project_description,
      questions: analysis.questions,
      userId: userId,
      questions_done: false
    });

    // If project creation successful, trigger expert search server-side
    if (projectResult.success && projectResult.project && analysis.expert_search_query) {
      console.log('🔍 Triggering expert search for new project...');
      
      try {
        await triggerExpertSearchServerSide(analysis.expert_search_query, projectResult.project.id);
      } catch (error) {
        console.error('❌ Exception triggering expert search:', error);
      }
    }

    return {
      ...projectResult,
      expertSearchQuery: analysis.expert_search_query
    };
    
  } catch (error) {
    console.error('❌ AI analysis failed, falling back to basic creation:', error);
    
    // Fallback to simple project creation if AI fails
    const projectName = generateTestProjectName();
    const conversationOnly = transcript.replace(/^AI:\s*/, '');
    
    return await createProject({
      name: projectName,
      description: "Project created from voice call - AI analysis unavailable",
      questions: [conversationOnly],
      userId: userId,
      questions_done: false
    });
  }
}