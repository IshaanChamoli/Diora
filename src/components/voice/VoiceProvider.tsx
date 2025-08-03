"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VoiceContextType {
  isCallActive: boolean;
  currentAgent: string | null;
  startCall: (agentType: string) => void;
  endCall: () => void;
  userFirstName: string | null;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);

  // Fetch user's first name on component mount
  useEffect(() => {
    async function fetchUserFirstName() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          return;
        }

        const { data: investorData, error: investorError } = await supabase
          .from('investors')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (investorError) {
          console.error('Error fetching investor data:', investorError);
          return;
        }

        setUserFirstName(investorData.first_name);
        console.log('✅ User first name fetched:', investorData.first_name);
      } catch (error) {
        console.error('Error fetching user first name:', error);
      }
    }

    fetchUserFirstName();
  }, []);

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
      endCall,
      userFirstName
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