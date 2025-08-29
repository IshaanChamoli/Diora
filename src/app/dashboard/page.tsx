"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "./components/Sidebar";
import { VoiceProvider } from "@/components/voice/VoiceProvider";
import VoiceButton from "@/components/voice/VoiceButton";
import { useVoice } from "@/components/voice/VoiceProvider";

function DashboardContent() {
  const { isCallActive } = useVoice();
  
  // Debug environment variables (remove this in production)
  useEffect(() => {
    console.log('🔧 Environment check:');
    console.log('- VAPI_API_KEY:', process.env.NEXT_PUBLIC_VAPI_API_KEY ? 'Set' : 'Missing');
    console.log('- VAPI_QUESTIONS_ASSISTANT_ID:', process.env.NEXT_PUBLIC_VAPI_QUESTIONS_ASSISTANT_ID ? 'Set' : 'Missing');
    console.log('- VAPI_DASHBOARD_ASSISTANT_ID:', process.env.NEXT_PUBLIC_VAPI_DASHBOARD_ASSISTANT_ID ? 'Set' : 'Missing');
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center">
      {/* Centered content div */}
      <div className="flex flex-col items-center text-center">
        {/* Central circular logo */}
        <div className="mb-8">
          <Image
            src="/logo.gif"
            alt="Diora Central Logo"
            width={200}
            height={200}
            className={`w-48 h-48 ${isCallActive ? 'animate-pulse' : ''}`}
            priority
            unoptimized
          />
        </div>
        
        {/* Main heading - changes when call is active */}
        <h1 className="font-primary font-semibold text-4xl mb-4 text-black">
          {isCallActive ? "I'm listening..." : "Let's find some experts"}
        </h1>
        
        {/* Tagline - changes when call is active */}
        <p className="font-primary font-light text-md mb-8 text-black">
          {isCallActive ? "Tell me about your project" : "Diora will find the best matches for your project"}
        </p>
        
        {/* Voice Button - replaces the original Start Now button */}
        <VoiceButton 
          variant="dashboard"
          agentType="dashboard"
          width={40}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get the current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.push('/signup');
          return;
        }

        // Check if user has investor profile
        const { error: investorError } = await supabase
          .from('investors')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (investorError) {
          console.error('Error fetching investor data:', investorError);
          router.push('/signup');
          return;
        }

      } catch (error) {
        console.error('Dashboard error:', error);
        router.push('/signup');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-primary font-semibold text-black mb-4">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <VoiceProvider>
      <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex">
        {/* Universal Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <DashboardContent />
      </div>
    </VoiceProvider>
  );
} 