import Vapi from '@vapi-ai/web';
import { supabase } from './supabase';

export interface VapiConfig {
  assistantId: string;
}

// Define proper types for tool calls
interface ToolCallFunction {
  arguments: {
    question_text?: string;
    question_index?: number;
    description_text?: string;
    [key: string]: unknown;
  };
}

interface ToolCall {
  function?: ToolCallFunction;
  [key: string]: unknown;
}

export const AGENT_CONFIGS: Record<string, VapiConfig> = {
  questions: {
    assistantId: process.env.NEXT_PUBLIC_VAPI_QUESTIONS_ASSISTANT_ID || 'questions-assistant-id',
  },
  experts: {
    assistantId: 'experts-agent-id', 
  },
  insights: {
    assistantId: 'insights-agent-id',
  },
  dashboard: {
    assistantId: process.env.NEXT_PUBLIC_VAPI_DASHBOARD_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_QUESTIONS_ASSISTANT_ID || 'dashboard-agent-id',
  }
};

class VapiService {
  private static instance: VapiService;
  private vapi: Vapi | null = null;
  private isInitialized = false;
  private currentProjectSlug: string | null = null;
  private onAddQuestionCallback: ((questionText: string) => void) | null = null;
  private onAddDescriptionCallback: ((descriptionText: string) => void) | null = null;
  private onActivateContinueButtonCallback: (() => void) | null = null;
  // private onDeleteQuestionCallback: ((questionIndex: number) => void) | null = null;

  private constructor() {
    // Initialize Vapi instance
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    console.log('🔑 VAPI API Key check:', apiKey ? 'Found' : 'Missing');
    
    if (!apiKey) {
      console.warn('⚠️ VAPI_API_KEY not found in environment variables');
      return;
    }

    try {
      console.log('🚀 Initializing Vapi with API key...');
      this.vapi = new Vapi(apiKey);
      this.isInitialized = true;
      console.log('✅ Vapi initialized successfully');
      
      // Set up event listeners
      this.vapi.on('call-start', () => {
        console.log('Vapi call started');
      });
      
      this.vapi.on('call-end', () => {
        console.log('Vapi call ended');
      });
      
      this.vapi.on('message', async (message) => {
        console.log('Vapi message received:', message); // Debug log
        if (message.type === 'transcript') {
          console.log(`${message.role}: ${message.transcript}`);
        } else if (message.type === 'tool-calls') {
          console.log('Tool calls detected:', message.toolCalls); // Debug log
          // Handle tool calls
          for (const toolCall of message.toolCalls) {
            console.log('Processing tool call:', toolCall.function?.name); // Debug log
            if (toolCall.function?.name === 'add_question') {
              console.log('Add question tool call found:', toolCall); // Debug log
              await this.handleAddQuestionToolCall(toolCall);
            } else if (toolCall.function?.name === 'add_description') {
              console.log('Add description tool call found:', toolCall); // Debug log
              await this.handleAddDescriptionToolCall(toolCall);
            } else if (toolCall.function?.name === 'activate_continue_button') {
              console.log('Activate continue button tool call found:', toolCall); // Debug log
              await this.handleActivateContinueButtonToolCall();
            }
            // else if (toolCall.function?.name === 'delete_question') {
            //   console.log('Delete question tool call found:', toolCall); // Debug log
            //   await this.handleDeleteQuestionToolCall(toolCall);
            // } else {
            //   console.log('Unknown tool call:', toolCall.function?.name); // Debug log
            // }
          }
        }
      });
      
      this.vapi.on('error', (error) => {
        console.error('❌ Vapi error details:', error);
        console.error('❌ Vapi error type:', typeof error);
        console.error('❌ Vapi error stringified:', JSON.stringify(error, null, 2));
      });
      
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
    }
  }

  private async handleAddQuestionToolCall(toolCall: ToolCall) {
    try {
      // Get the authenticated user's ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting authenticated user:', authError);
        return;
      }

      // Get the question text from the tool call arguments
      const questionText = toolCall.function?.arguments?.question_text || '';

      // Log all three pieces of information
      console.log(`Tool Call Detected - User: ${user.id}, Project Slug: ${this.currentProjectSlug}, Question Text: ${questionText}`);
      
      // Call the callback to update the UI
      if (this.onAddQuestionCallback && questionText) {
        this.onAddQuestionCallback(questionText);
      }
      
    } catch (error: unknown) {
      console.error('Error handling add_question tool call:', error);
    }
  }

  private async handleAddDescriptionToolCall(toolCall: ToolCall) {
    try {
      // Get the authenticated user's ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting authenticated user:', authError);
        return;
      }

      // Get the description text from the tool call arguments
      const descriptionText = toolCall.function?.arguments?.description_text || '';

      // Log all three pieces of information
      console.log(`Description Tool Call Detected - User: ${user.id}, Project Slug: ${this.currentProjectSlug}, Description Text: ${descriptionText}`);
      
      // Call the callback to update the UI
      if (this.onAddDescriptionCallback && descriptionText) {
        this.onAddDescriptionCallback(descriptionText);
      }
      
    } catch (error: unknown) {
      console.error('Error handling add_description tool call:', error);
    }
  }

  private async handleActivateContinueButtonToolCall() {
    try {
      // Get the authenticated user's ID (for consistency with other handlers)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting authenticated user:', authError);
        return;
      }

      // Log the tool call detection
      console.log(`Activate Continue Button Tool Call Detected - User: ${user.id}, Project Slug: ${this.currentProjectSlug}`);
      
      // Call the callback to update the UI (no parameters needed)
      if (this.onActivateContinueButtonCallback) {
        this.onActivateContinueButtonCallback();
      }
      
    } catch (error: unknown) {
      console.error('Error handling activate_continue_button tool call:', error);
    }
  }

  // private async handleDeleteQuestionToolCall(toolCall: ToolCall) {
  //   try {
  //     // Get the authenticated user's ID
  //     const { data: { user }, error: authError } = await supabase.auth.getUser();
  //     if (authError || !user) {
  //       console.error('Error getting authenticated user:', authError);
  //       return;
  //     }

  //     // Get the question index from the tool call arguments
  //     const questionIndex = toolCall.function?.arguments?.question_index || 0;

  //     // Log all three pieces of information
  //     console.log(`Delete Tool Call Detected - User: ${user.id}, Project Slug: ${this.currentProjectSlug}, Question Index: ${questionIndex}`);
      
  //     // Call the callback to update the UI
  //     if (this.onDeleteQuestionCallback !== null) {
  //       this.onDeleteQuestionCallback(questionIndex);
  //     }
      
  //   } catch (error: unknown) {
  //     console.error('Error handling delete_question tool call:', error);
  //   }
  // }

  // Method to set the current project slug
  setCurrentProjectSlug(slug: string) {
    this.currentProjectSlug = slug;
  }

  // Method to set the callback for adding questions
  setOnAddQuestionCallback(callback: (questionText: string) => void) {
    this.onAddQuestionCallback = callback;
  }

  // Method to set the callback for adding descriptions
  setOnAddDescriptionCallback(callback: (descriptionText: string) => void) {
    this.onAddDescriptionCallback = callback;
  }

  // Method to set the callback for activating continue button
  setOnActivateContinueButtonCallback(callback: () => void) {
    this.onActivateContinueButtonCallback = callback;
  }

  // Method to set the callback for deleting questions
  // setOnDeleteQuestionCallback(callback: (questionIndex: number) => void) {
  //   this.onDeleteQuestionCallback = callback;
  // }

  static getInstance(): VapiService {
    if (!VapiService.instance) {
      VapiService.instance = new VapiService();
    }
    return VapiService.instance;
  }

  async startCall(agentType: string, variableValues?: Record<string, unknown>): Promise<void> {
    console.log('🎯 Starting call with agent type:', agentType);
    
    if (!this.isInitialized || !this.vapi) {
      console.error('❌ Vapi not initialized - isInitialized:', this.isInitialized, 'vapi instance:', !!this.vapi);
      return;
    }

    const config = AGENT_CONFIGS[agentType];
    console.log('🔧 Agent config for', agentType, ':', config);
    
    if (!config) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    try {
      // Log user ID and project slug when call starts
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('⚠️ Error getting authenticated user on call start:', authError);
      } else {
        console.log(`👤 Vapi Call Started - User: ${user.id}, Project Slug: ${this.currentProjectSlug}`);
      }

      console.log('🚀 About to start vapi call with:', {
        assistantId: config.assistantId,
        variableValues: variableValues || {}
      });
      
      await this.vapi.start(config.assistantId, {
        variableValues: variableValues || {}
      });
      console.log(`✅ Started Vapi call with agent: ${agentType}`, variableValues);
    } catch (error: unknown) {
      console.error('❌ Error starting Vapi call:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
  }

  async endCall(): Promise<void> {
    if (!this.isInitialized || !this.vapi) {
      console.error('Vapi not initialized');
      return;
    }

    try {
      await this.vapi.stop();
      console.log('Ended Vapi call');
    } catch (error) {
      console.error('Error ending Vapi call:', error);
      throw error;
    }
  }

  async isCallActive(): Promise<boolean> {
    if (!this.isInitialized || !this.vapi) {
      return false;
    }
    
    // Vapi doesn't have a direct isCallActive method, so we'll track this via events
    // For now, return false - the actual state is managed by VoiceProvider
    return false;
  }
}

export const vapiService = VapiService.getInstance(); 