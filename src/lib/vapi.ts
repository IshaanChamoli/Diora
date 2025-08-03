import Vapi from '@vapi-ai/web';

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
      
      this.vapi.on('message', (message) => {
        if (message.type === 'transcript') {
          console.log(`${message.role}: ${message.transcript}`);
        }
      });
      
      this.vapi.on('error', (error) => {
        console.error('Vapi error:', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
    }
  }

  static getInstance(): VapiService {
    if (!VapiService.instance) {
      VapiService.instance = new VapiService();
    }
    return VapiService.instance;
  }

  async startCall(agentType: string): Promise<void> {
    if (!this.isInitialized || !this.vapi) {
      console.error('Vapi not initialized');
      return;
    }

    const config = AGENT_CONFIGS[agentType];
    if (!config) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    try {
      await this.vapi.start(config.assistantId);
      console.log(`Started Vapi call with agent: ${agentType}`);
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