"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AudioLines } from "lucide-react";
import Sidebar from "./components/Sidebar";
import { VoiceProvider } from "@/components/voice/VoiceProvider";

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
        const { data: investorData, error: investorError } = await supabase
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
                className="w-48 h-48"
                priority
                unoptimized
              />
            </div>
            
            {/* Main heading */}
            <h1 className="font-primary font-semibold text-4xl mb-4 text-black">
              Let's find some experts
            </h1>
            
            {/* Tagline */}
            <p className="font-primary font-light text-md mb-8 text-black">
              Diora will find the best matches for your project
            </p>
            
            {/* Call to action button */}
            <button className="w-[160px] h-[40px] bg-[rgb(75,46,182)] text-white rounded-xl font-primary font-light text-[18px] flex items-center justify-center gap-[6px] hover:bg-[rgb(65,36,172)] transition-colors">
              <AudioLines className="w-3.5 h-3.5" />
              Start now
            </button>
          </div>
        </div>
      </div>
    </VoiceProvider>
  );
} 