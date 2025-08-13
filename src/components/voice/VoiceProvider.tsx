"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VoiceContextType {
  isCallActive: boolean;
  currentAgent: string | null;
  startCall: (agentType: string) => void;
  endCall: () => void;
  userFirstName: string | null;
  projectId: string | null;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: ReactNode;
  projectSlug?: string; // Add project slug prop to know which project we're in
}

export function VoiceProvider({ children, projectSlug }: VoiceProviderProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Fetch user's first name and project ID on component mount
  useEffect(() => {
    async function fetchUserDataAndProject() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          return;
        }

        // Fetch user's first name from investors table
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

        // Fetch project ID if projectSlug is provided
        if (projectSlug) {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('slug', projectSlug)
            .eq('investor_id', user.id)
            .single();

          if (projectError) {
            console.error('Error fetching project data:', projectError);
            return;
          }

          setProjectId(projectData.id);
          console.log('✅ Project ID fetched:', projectData.id);
        }
      } catch (error) {
        console.error('Error fetching user data and project:', error);
      }
    }

    fetchUserDataAndProject();
  }, [projectSlug]);

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
      userFirstName,
      projectId
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