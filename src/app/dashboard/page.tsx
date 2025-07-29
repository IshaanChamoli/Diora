"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [firstName, setFirstName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get the current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.push('/sign-up');
          return;
        }

        // Fetch the investor data for this user
        const { data: investorData, error: investorError } = await supabase
          .from('investors')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (investorError) {
          console.error('Error fetching investor data:', investorError);
          router.push('/sign-up');
          return;
        }

        setFirstName(investorData.first_name);
      } catch (error) {
        console.error('Dashboard error:', error);
        router.push('/sign-up');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
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
    <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-primary font-semibold text-black mb-4">
          Hey, {firstName}! 👋
        </h1>
        <p className="text-lg font-secondary text-gray-600">
          Welcome to your dashboard
        </p>
      </div>
    </div>
  );
} 