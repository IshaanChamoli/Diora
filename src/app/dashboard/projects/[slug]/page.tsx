"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { List, Pencil, FileText, DollarSign } from "lucide-react";
import ExpertList from "./components/ExpertList";
import Questions from "./components/Questions";
import Insights from "./components/Insights";
import Financial from "./components/Financial";
import { VoiceProvider } from "@/components/voice/VoiceProvider";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'expert-list' | 'questions' | 'insights' | 'financial'>('questions');
  const router = useRouter();
  
  // Unwrap params Promise using React.use()
  const { slug } = use(params);

  useEffect(() => {
    async function fetchProject() {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.push('/signup');
          return;
        }

        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .eq('investor_id', user.id)
          .single();

        if (projectError) {
          // Don't log expected errors (project not found)
          if (projectError.code === 'PGRST116') {
            // Project not found - redirect silently
            router.push('/dashboard');
            return;
          }
          
          // Log unexpected errors
          console.error('Project fetch error:', projectError);
          router.push('/dashboard');
          return;
        }

        setProject(projectData);
      } catch (error) {
        console.error('Project page error:', error);
        // Redirect to dashboard on any error
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex">
        {/* Keep sidebar visible during loading */}
        <Sidebar 
          currentProjectSlug={slug}
          currentProjectName=""
        />
        
        {/* Loading state only in main content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-primary font-semibold text-black mb-4">
              Loading project...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no project found, show loading (will redirect)
  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex">
        {/* Keep sidebar visible during redirect */}
        <Sidebar 
          currentProjectSlug={slug}
          currentProjectName=""
        />
        
        {/* Redirecting state only in main content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-primary font-semibold text-black mb-4">
              Redirecting...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VoiceProvider>
      <div className="h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex overflow-hidden">
        {/* Universal Sidebar with current project info */}
        <Sidebar 
          currentProjectSlug={project.slug}
          currentProjectName={project.name}
        />
        
        {/* Main content area */}
        <div className="flex-1 p-8 overflow-hidden">
          {/* Project Header - new design */}
          <div className="bg-[rgba(80,44,189,0.06)] border border-[rgb(80,44,189)] rounded-2xl p-6 mb-6" style={{ minHeight: 100 }}>
            <div className="flex flex-col gap-1">
              <h1 className="font-primary font-semibold text-2xl text-black mb-1">
                {project.name}
              </h1>
              <p className="font-secondary text-gray-600 mb-2">
                {project.description || 'No description available'}
              </p>
              {/* Placeholder tags/buttons */}
              <div className="flex gap-2 mt-1">
                <span className="px-3 py-1 bg-white border border-[rgb(80,44,189)] text-[rgb(80,44,189)] rounded-full text-xs font-medium cursor-pointer hover:bg-[rgba(80,44,189,0.12)] transition-colors">Neurology</span>
                <span className="px-3 py-1 bg-white border border-[rgb(80,44,189)] text-[rgb(80,44,189)] rounded-full text-xs font-medium cursor-pointer hover:bg-[rgba(80,44,189,0.12)] transition-colors">Drug Discovery</span>
                <span className="px-3 py-1 bg-white border border-[rgb(80,44,189)] text-[rgb(80,44,189)] rounded-full text-xs font-medium cursor-pointer hover:bg-[rgba(80,44,189,0.12)] transition-colors">AI</span>
              </div>
            </div>
          </div>

          {/* Navigation Header */}
          <div className="flex items-center gap-6 mb-4">
            <button 
              onClick={() => setCurrentSection('questions')}
              className={`flex items-center gap-2 transition-colors text-sm font-medium rounded-lg px-2.5 py-1.5 ${
                currentSection === 'questions' 
                  ? 'bg-[rgba(80,44,189,0.1)] text-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Questions
            </button>
            <button 
              onClick={() => setCurrentSection('expert-list')}
              className={`flex items-center gap-2 transition-colors text-sm font-medium rounded-lg px-2.5 py-1.5 ${
                currentSection === 'expert-list' 
                  ? 'bg-[rgba(80,44,189,0.1)] text-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Expert List
            </button>
            <button 
              onClick={() => setCurrentSection('insights')}
              className={`flex items-center gap-2 transition-colors text-sm font-medium rounded-lg px-2.5 py-1.5 ${
                currentSection === 'insights' 
                  ? 'bg-[rgba(80,44,189,0.1)] text-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Insights
            </button>
            <button 
              onClick={() => setCurrentSection('financial')}
              className={`flex items-center gap-2 transition-colors text-sm font-medium rounded-lg px-2.5 py-1.5 ${
                currentSection === 'financial' 
                  ? 'bg-[rgba(80,44,189,0.1)] text-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Financial
            </button>
          </div>
          
          {/* Horizontal divider */}
          <div className="border-b border-gray-400 mb-4"></div>

          {/* Section Content */}
          <div className="h-[calc(100vh-276px)] overflow-hidden">
            {currentSection === 'expert-list' && <ExpertList />}
            {currentSection === 'questions' && <Questions />}
            {currentSection === 'insights' && <Insights />}
            {currentSection === 'financial' && <Financial />}
          </div>
        </div>
      </div>
    </VoiceProvider>
  );
} 