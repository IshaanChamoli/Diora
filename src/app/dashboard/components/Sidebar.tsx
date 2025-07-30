"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, ArrowRight } from "lucide-react";

interface SidebarProps {
  currentProjectSlug?: string;
  currentProjectName?: string;
}

export default function Sidebar({ currentProjectSlug, currentProjectName }: SidebarProps) {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_PROJECT_NAME_LENGTH = 20;

  // Generate clean slug from project name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    if (projectName.trim().length > MAX_PROJECT_NAME_LENGTH) {
      setError(`Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or less`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError("Authentication error");
        return;
      }

      const slug = generateSlug(projectName.trim());

      // Check if project with same slug already exists for this user
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('name')
        .eq('slug', slug)
        .eq('investor_id', user.id)
        .single();

      if (existingProject) {
        setError(`A project named "${existingProject.name}" already exists. Please choose a different name.`);
        setIsLoading(false);
        return;
      }

      // Create project in database
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          slug: slug,
          investor_id: user.id
        })
        .select()
        .single();

      if (projectError) {
        console.error('Project creation error:', projectError);
        setError('Failed to create project. Please try again.');
        return;
      }

      // Success! Reset form and redirect
      setProjectName("");
      setShowCreateInput(false);
      setError("");
      router.push(`/dashboard/projects/${project.slug}`);
      
    } catch (err) {
      console.error('Create project error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    } else if (e.key === 'Escape') {
      setShowCreateInput(false);
      setProjectName("");
      setError("");
    }
  };

  // Focus input when it appears
  useEffect(() => {
    if (showCreateInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateInput]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCreateInput && inputRef.current) {
        const target = event.target as Node;
        const inputContainer = inputRef.current.closest('.flex.flex-col.rounded-lg');
        
        // Only close if click is outside the entire dropdown container
        if (inputContainer && !inputContainer.contains(target)) {
          setShowCreateInput(false);
          setProjectName("");
          setError("");
        }
      }
    };

    if (showCreateInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateInput]);

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

        // Fetch user's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, slug')
          .eq('investor_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
        } else {
          setProjects(projectsData || []);
        }

      } catch (error) {
        console.error('Sidebar error:', error);
        router.push('/signup');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="w-[18%] min-w-64 bg-white shadow-2xl h-screen flex flex-col">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-sm font-primary font-semibold text-black">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
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
          <div 
            className={`flex flex-col rounded-lg border border-[rgb(75,46,182)] text-[rgb(75,46,182)] cursor-pointer transition-all duration-200 ${
              showCreateInput 
                ? 'bg-white shadow-md' 
                : 'bg-[rgba(80,44,189,0.1)] hover:bg-[rgba(80,44,189,0.15)]'
            }`}
            onClick={() => {
              if (!showCreateInput) {
                setShowCreateInput(true);
              }
            }}
          >
            {/* Button part - always visible */}
            <div 
              className="flex items-center h-[42px] px-3"
              onClick={(e) => {
                if (showCreateInput) {
                  e.preventDefault();
                  e.stopPropagation();
                  // Small delay to prevent rapid close/open
                  setTimeout(() => {
                    setShowCreateInput(false);
                    setProjectName("");
                    setError("");
                  }, 100);
                }
              }}
            >
              <div className="w-4 h-4 mr-3 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-xs font-medium">Start a new project</span>
            </div>

            {/* Input part - appears when expanded */}
            {showCreateInput && (
              <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter project name..."
                    maxLength={MAX_PROJECT_NAME_LENGTH}
                    className="w-full h-8 px-3 pr-12 border border-gray-300 rounded-lg font-secondary text-xs placeholder-gray-400 focus:outline-none focus:border-[rgb(75,46,182)] transition-colors"
                  />
                  {projectName.length === MAX_PROJECT_NAME_LENGTH && (
                    <div className="absolute -top-6 right-0 text-xs text-red-500 font-medium">
                      20/20
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateProject();
                    }}
                    disabled={isLoading || !projectName.trim()}
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-8 bg-[rgb(75,46,182)] text-white rounded-r-lg hover:bg-[rgb(65,36,172)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
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
          {projects.map((project) => (
            <div 
              key={project.id}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                currentProjectSlug === project.slug ? 'bg-gray-100' : ''
              }`}
              onClick={() => router.push(`/dashboard/projects/${project.slug}`)}
            >
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-600">{project.name}</span>
                {currentProjectSlug === project.slug && (
                  <div className="w-1 h-1 bg-red-500 rounded-full ml-2"></div>
                )}
              </div>
              {currentProjectSlug === project.slug && (
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
  );
} 