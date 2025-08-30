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

// Trigger expert search using the existing working api/clado-search endpoint
async function triggerExpertSearchServerSide(searchQuery: string, projectId: string): Promise<void> {
  const callId = `auto-${projectId}-${Date.now()}`;
  
  console.log(`🔍 Auto-triggering expert search for project ${projectId} with query: "${searchQuery}" [Call ID: ${callId}]`);

  try {
    // Use NEXT_PUBLIC_APP_URL from environment
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/clado-search`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-call-id': callId
      },
      body: JSON.stringify({
        search_query: searchQuery,
        project_id: projectId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to trigger expert search:', errorText);
      throw new Error(`Failed to trigger expert search: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Expert search initiated successfully:`, result);
    
  } catch (error) {
    console.error('❌ Exception triggering expert search via api/clado-search:', error);
    
    // Update project status to failed
    try {
      await supabase
        .from('projects')
        .update({ clado_status: 'failed' })
        .eq('id', projectId);
    } catch (updateError) {
      console.error('❌ Failed to update clado_status to failed:', updateError);
    }
    
    throw error;
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

    // If project creation successful, save expert query and trigger expert search server-side
    if (projectResult.success && projectResult.project && analysis.expert_search_query) {
      console.log('💾 Saving expert query to project...');
      
      try {
        // First, save the expert query to the project
        const { error: updateError } = await supabase
          .from('projects')
          .update({ 
            expert_query: analysis.expert_search_query,
            clado_status: 'searching',
            clado_polling_count: 0
          })
          .eq('id', projectResult.project.id);

        if (updateError) {
          console.error('❌ Error saving expert query to project:', updateError);
        } else {
          console.log('✅ Expert query saved to project');
        }

        // Then trigger the expert search
        console.log('🔍 Triggering expert search for new project...');
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

// Update existing project with OpenRouter analysis
export async function updateProjectFromCall(transcript: string, userId: string, projectId: string): Promise<ProjectCreationResult> {
  try {
    console.log('🤖 Analyzing transcript with OpenRouter...');
    
    const analysis = await analyzeTranscript(transcript);
    
    console.log('✅ AI analysis complete:', {
      title: analysis.project_title,
      description: analysis.project_description.substring(0, 100) + '...',
      questionsCount: analysis.questions.length,
      expertSearchQuery: analysis.expert_search_query
    });
    
    // Update the existing project with analyzed data (keep original slug)
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        name: analysis.project_title,
        description: analysis.project_description,
        questions: analysis.questions,
        expert_query: analysis.expert_search_query,
        clado_status: 'searching',
        clado_polling_count: 0
      })
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating project:', updateError);
      return {
        success: false,
        error: `Failed to update project: ${updateError.message}`,
        project: undefined
      };
    }

    console.log('✅ Project updated successfully');

    // Trigger expert search server-side
    console.log('🔍 Triggering expert search for updated project...');
    
    try {
      await triggerExpertSearchServerSide(analysis.expert_search_query, projectId);
    } catch (error) {
      console.error('❌ Exception triggering expert search:', error);
    }

    return {
      success: true,
      project: updatedProject,
      error: undefined,
      expertSearchQuery: analysis.expert_search_query
    };

  } catch (error) {
    console.error('❌ Error in updateProjectFromCall:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project: undefined
    };
  }
}

