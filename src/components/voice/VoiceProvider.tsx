"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceContextType {
  isCallActive: boolean;
  currentAgent: string | null;
  startCall: (agentType: string) => void;
  endCall: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);

  const startCall = (agentType: string) => {
    // TODO: Implement Vapi call start
    console.log(`Starting call with agent: ${agentType}`);
    setIsCallActive(true);
    setCurrentAgent(agentType);
  };

  const endCall = () => {
    // TODO: Implement Vapi call end
    console.log('Ending call');
    setIsCallActive(false);
    setCurrentAgent(null);
  };

  return (
    <VoiceContext.Provider value={{
      isCallActive,
      currentAgent,
      startCall,
      endCall
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
} 