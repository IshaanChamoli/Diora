"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AudioLines } from "lucide-react";

export default function Dashboard() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Sample projects array - will be replaced with database data
  const sampleProjects = [
    { id: 1, name: "Sample Project", hasRedDot: true, isHighlighted: true, hasMenu: true },
    { id: 2, name: "Sample Project", hasRedDot: true, isHighlighted: false, hasMenu: false },
    { id: 3, name: "Sample Project", hasRedDot: false, isHighlighted: false, hasMenu: false },
    { id: 4, name: "Sample Project", hasRedDot: false, isHighlighted: false, hasMenu: false },
  ];

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get the current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.push('/signup');
          return;
        }

        // Fetch the investor data for this user
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

        setFirstName(investorData.first_name);
        setLastName(investorData.last_name);
      } catch (error) {
        console.error('Dashboard error:', error);
        router.push('/signup');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  // Get user initials
  const getInitials = () => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Get current year with fallback
  const getCurrentYear = () => {
    try {
      return new Date().getFullYear();
    } catch {
      return 2025;
    }
  };

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
    <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex">
      {/* White sidebar panel */}
      <div className="w-[18%] min-w-64 bg-white shadow-2xl h-screen flex flex-col">
        {/* Logo in top left corner */}
        <div className="p-6 pb-4 mb-20">
            <Image
              src="/logo-with-text.png"
              alt="Diora Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
        </div>
        
        {/* Quick Tools Section */}
        <div className="px-6 mb-8">
          <h2 className="text-md font-primary font-semibold text-black mb-4">
            Quick Tools
          </h2>
          
          <div className="space-y-3">
            {/* Start a new project */}
            <div className="flex items-center h-[42px] px-3 rounded-lg bg-[rgba(80,44,189,0.1)] border border-[rgb(75,46,182)] text-[rgb(75,46,182)] cursor-pointer hover:bg-[rgba(80,44,189,0.15)] transition-colors">
              <div className="w-4 h-4 mr-3 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-xs font-medium">Start a new project</span>
            </div>
            
            {/* Favorite Experts */}
            <div className="flex items-center h-[42px] px-3 rounded-lg bg-[rgba(80,44,189,0.1)] border border-[rgb(75,46,182)] text-[rgb(75,46,182)] cursor-pointer hover:bg-[rgba(80,44,189,0.15)] transition-colors">
              <div className="w-4 h-4 mr-3 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium">Favorite Experts</span>
            </div>
            
            {/* Search Projects */}
            <div className="flex items-center h-[42px] px-3 rounded-lg bg-white border border-gray-300 text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-4 h-4 mr-3 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium">Search Projects...</span>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="px-6 mb-6">
          <div className="border-t border-gray-200"></div>
        </div>
        
        {/* Project History Section */}
        <div className="px-6 mb-6">
          <h2 className="text-md font-primary font-semibold text-black mb-4">
            Project History
          </h2>
          
          <div className="space-y-2">
            {/* Project List */}
            {sampleProjects.map((project) => (
              <div 
                key={project.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  project.isHighlighted ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="text-xs font-medium text-gray-600">{project.name}</span>
                  {project.hasRedDot && (
                    <div className="w-1 h-1 bg-red-500 rounded-full ml-2"></div>
                  )}
                </div>
                {project.hasMenu && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            
            {/* Load more link */}
            <div className="pt-2">
              <span className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                + Load more
              </span>
            </div>
          </div>
        </div>
        
        {/* Sidebar content will go here */}
        <div className="flex-1">
          {/* Content will be added here */}
        </div>
        
        {/* Profile section at bottom */}
        <div className="p-6">
          {/* Profile icon above text */}
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full border border-[rgb(75,46,182)] bg-[rgba(80,44,189,0.1)] flex items-center justify-center">
              <span className="text-[rgb(75,46,182)] text-sm font-medium">
                {getInitials()}
              </span>
            </div>
          </div>
          
          {/* Copyright text */}
          <div className="text-[rgb(75,46,182)] text-xs">
            Diora AI © {getCurrentYear()}. All Rights Reserved
          </div>
        </div>
      </div>
      
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
  );
} 