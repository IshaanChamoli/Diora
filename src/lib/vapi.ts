// TODO: Import Vapi SDK when ready
// import { Vapi } from '@vapi-ai/web';

export interface VapiConfig {
  assistantId: string;
  prompt?: string;
}

export const AGENT_CONFIGS: Record<string, VapiConfig> = {
  questions: {
    assistantId: 'questions-agent-id',
    prompt: 'You are a questions assistant for Diora. Help users formulate and refine their questions.'
  },
  experts: {
    assistantId: 'experts-agent-id', 
    prompt: 'You are an expert discovery assistant for Diora. Help users find and evaluate experts.'
  },
  insights: {
    assistantId: 'insights-agent-id',
    prompt: 'You are an insights assistant for Diora. Help users analyze project insights and data.'
  },
  dashboard: {
    assistantId: 'dashboard-agent-id',
    prompt: 'You are a general assistant for Diora. Help users create and manage projects.'
  }
};

export class VapiService {
  private static instance: VapiService;
  // private vapi: any; // TODO: Add Vapi instance

  private constructor() {
    // TODO: Initialize Vapi
    // this.vapi = new Vapi({ apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY });
  }

  static getInstance(): VapiService {
    if (!VapiService.instance) {
      VapiService.instance = new VapiService();
    }
    return VapiService.instance;
  }

  async startCall(agentType: string): Promise<void> {
    const config = AGENT_CONFIGS[agentType];
    if (!config) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    // TODO: Implement actual Vapi call
    console.log(`Starting Vapi call with agent: ${agentType}`, config);
  }

  async endCall(): Promise<void> {
    // TODO: Implement actual Vapi call end
    console.log('Ending Vapi call');
  }

  async isCallActive(): Promise<boolean> {
    // TODO: Check actual call status
    return false;
  }
}

export const vapiService = VapiService.getInstance(); 