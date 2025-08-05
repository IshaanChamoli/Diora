import Vapi from '@vapi-ai/web';
import { supabase } from './supabase';

export interface VapiConfig {
  assistantId: string;
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
    assistantId: 'dashboard-agent-id',
  }
};

class VapiService {
  private static instance: VapiService;
  private vapi: Vapi | null = null;
  private isInitialized = false;
  private currentProjectSlug: string | null = null;
  private onAddQuestionCallback: ((questionText: string) => void) | null = null;

  private constructor() {
    // Initialize Vapi instance
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      console.warn('VAPI_API_KEY not found in environment variables');
      return;
    }

    try {
      this.vapi = new Vapi(apiKey);
      this.isInitialized = true;
      
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
            if (toolCall.function?.name === 'add_question') {
              console.log('Add question tool call found:', toolCall); // Debug log
              await this.handleAddQuestionToolCall(toolCall);
            }
          }
        }
      });
      
      this.vapi.on('error', (error) => {
        console.error('Vapi error:', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
    }
  }

  private async handleAddQuestionToolCall(toolCall: any) {
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
      
    } catch (error) {
      console.error('Error handling add_question tool call:', error);
    }
  }

  // Method to set the current project slug
  setCurrentProjectSlug(slug: string) {
    this.currentProjectSlug = slug;
  }

  // Method to set the callback for adding questions
  setOnAddQuestionCallback(callback: (questionText: string) => void) {
    this.onAddQuestionCallback = callback;
  }

  static getInstance(): VapiService {
    if (!VapiService.instance) {
      VapiService.instance = new VapiService();
    }
    return VapiService.instance;
  }

  async startCall(agentType: string, variableValues?: Record<string, any>): Promise<void> {
    if (!this.isInitialized || !this.vapi) {
      console.error('Vapi not initialized');
      return;
    }

    const config = AGENT_CONFIGS[agentType];
    if (!config) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    try {
      // Log user ID and project slug when call starts
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting authenticated user on call start:', authError);
      } else {
        console.log(`Vapi Call Started - User: ${user.id}, Project Slug: ${this.currentProjectSlug}`);
      }

      await this.vapi.start(config.assistantId, {
        variableValues: variableValues || {}
      });
      console.log(`Started Vapi call with agent: ${agentType}`, variableValues);
    } catch (error) {
      console.error('Error starting Vapi call:', error);
      throw error;
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