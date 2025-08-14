"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { List, Pencil, FileText, DollarSign } from "lucide-react";
import ExpertList from "./components/ExpertList";
import Questions from "./components/Questions";
import Insights from "./components/Insights";
import Financial from "./components/Financial";
import { VoiceProvider } from "@/components/voice/VoiceProvider";
import { vapiService } from "@/lib/vapi";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  questions_done: boolean;
}

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'expert-list' | 'questions' | 'insights' | 'financial'>('questions');
  const [optimisticQuestionsDone, setOptimisticQuestionsDone] = useState(false);
  
  // Debug current section changes
  useEffect(() => {
    console.log('📍 Current section changed to:', currentSection);
  }, [currentSection]);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescriptionText, setEditingDescriptionText] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Unwrap params Promise using React.use()
  const { slug } = use(params);
  
  // Check for section URL parameter and set initial section
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam && ['expert-list', 'questions', 'insights', 'financial'].includes(sectionParam)) {
      console.log('🔄 Navigating to section:', sectionParam);
      setCurrentSection(sectionParam as 'expert-list' | 'questions' | 'insights' | 'financial');
    }
  }, [searchParams]);

  // Additional effect to ensure section changes are applied when URL changes
  useEffect(() => {
    const handleRouteChange = () => {
      const currentUrl = new URL(window.location.href);
      const sectionParam = currentUrl.searchParams.get('section');
      if (sectionParam && ['expert-list', 'questions', 'insights', 'financial'].includes(sectionParam)) {
        console.log('🚀 URL changed, switching to section:', sectionParam);
        setCurrentSection(sectionParam as 'expert-list' | 'questions' | 'insights' | 'financial');
      }
    };

    // Listen for popstate events (back/forward button)
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for custom force expert section event
    const handleForceExpertSection = () => {
      console.log('🎯 Force expert section event received');
      setCurrentSection('expert-list');
    };
    
    // Listen for continue button click to immediately show tabs optimistically
    const handleContinueButtonClick = () => {
      console.log('⚡ Continue button clicked - showing tabs optimistically');
      setOptimisticQuestionsDone(true);
    };
    
    // Listen for project data update event
    const handleUpdateProjectData = async () => {
      console.log('🔄 Updating project data after questions_done change');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: projectData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .eq('investor_id', user.id)
          .single();

        if (!error && projectData) {
          setProject(projectData);
          console.log('✅ Project data updated, questions_done:', projectData.questions_done);
        }
      } catch (error) {
        console.error('Error updating project data:', error);
      }
    };
    
    window.addEventListener('forceExpertSection', handleForceExpertSection);
    window.addEventListener('updateProjectData', handleUpdateProjectData);
    window.addEventListener('continueButtonClicked', handleContinueButtonClick);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('forceExpertSection', handleForceExpertSection);
      window.removeEventListener('updateProjectData', handleUpdateProjectData);
      window.removeEventListener('continueButtonClicked', handleContinueButtonClick);
    };
  }, [slug]);

  // Save description to database
  const saveDescriptionToDb = useCallback(async (newDescription: string) => {
    if (!project) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: newDescription })
        .eq('slug', project.slug);

      if (error) {
        console.error('Error saving description:', error);
      }
    } catch (error) {
      console.error('Error saving description:', error);
    }
  }, [project]);

  // Handle description editing
  const handleEditDescription = () => {
    setIsEditingDescription(true);
    setEditingDescriptionText(project?.description || '');
  };

  const handleSaveDescription = async () => {
    if (!project) return;
    
    const originalText = project.description || "";
    const newText = editingDescriptionText.trim();
    
    // Exit edit mode immediately for smooth UX
    setIsEditingDescription(false);
    setEditingDescriptionText("");
    
    // Check if text actually changed
    if (newText === originalText) {
      return;
    }
    
    // Update UI immediately
    setProject(prevProject => {
      if (!prevProject) return prevProject;
      return { ...prevProject, description: newText };
    });
    
    // Save to database in background
    await saveDescriptionToDb(newText);
  };

  const handleDescriptionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveDescription();
    } else if (e.key === 'Escape') {
      setIsEditingDescription(false);
      setEditingDescriptionText("");
    }
  };

  // Set up callback for voice tool calls to update description
  useEffect(() => {
    if (project) {
      vapiService.setCurrentProjectSlug(project.slug);
      
      vapiService.setOnAddDescriptionCallback((descriptionText: string) => {
        // Update the project description in UI
        setProject(prevProject => {
          if (!prevProject) return prevProject;
          
          // Check if exact same description already exists
          if (prevProject.description === descriptionText) {
            console.log(`Exact same description already exists: ${descriptionText}`);
            return prevProject; // Return unchanged project
          }
          
          const updatedProject = { ...prevProject, description: descriptionText };
          // Save to database in background
          saveDescriptionToDb(descriptionText);
          return updatedProject;
        });
      });

      // Cleanup callback when component unmounts
      return () => {
        vapiService.setOnAddDescriptionCallback(() => {});
      };
    }
  }, [project, saveDescriptionToDb]);

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
        
        // Set initial section based on questions_done status
        if (projectData.questions_done) {
          console.log('📊 Questions already done, defaulting to expert-list section');
          setCurrentSection('expert-list');
        } else {
          console.log('❓ Questions not done, staying on questions section');
          setCurrentSection('questions');
        }
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
    <VoiceProvider projectSlug={project.slug}>
      <div className="h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex overflow-hidden">
        {/* Universal Sidebar with current project info */}
        <Sidebar 
          currentProjectSlug={project.slug}
          currentProjectName={project.name}
        />
        
        {/* Main content area */}
        <div className="flex-1 p-8 overflow-hidden">
          {/* Project Header - new design */}
          <div className="bg-[rgba(80,44,189,0.06)] border border-[rgb(80,44,189)] rounded-2xl pt-6 pr-6 pl-6 pb-2 mb-6 flex flex-col justify-between" style={{ minHeight: 140 }}>
            <div className="flex flex-col gap-1">
              <h1 className="font-primary font-semibold text-2xl text-black mb-1">
                {project.name}
              </h1>
              {isEditingDescription ? (
                <div className="mb-4" style={{ minHeight: '4.5rem', maxHeight: '4.5rem', height: '4.5rem' }}>
                  <textarea
                    value={editingDescriptionText}
                    onChange={(e) => setEditingDescriptionText(e.target.value)}
                    onKeyPress={handleDescriptionKeyPress}
                    onBlur={handleSaveDescription}
                    className="w-full h-full bg-transparent text-gray-600 focus:outline-none resize-none overflow-y-auto font-secondary custom-scrollbar"
                    placeholder="Add description here..."
                    autoFocus
                    style={{
                      minHeight: '4.5rem',
                      maxHeight: '4.5rem',
                      height: '4.5rem',
                      lineHeight: '1.5rem',
                    }}
                    onFocus={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      // Position cursor at the end
                      const length = target.value.length;
                      target.setSelectionRange(length, length);
                    }}
                  />
                </div>
              ) : (
                <p 
                  className="font-secondary text-gray-600 mb-4 cursor-pointer hover:text-gray-800 transition-colors custom-scrollbar"
                  onClick={handleEditDescription}
                  style={{ lineHeight: '1.5rem', maxHeight: '4.5rem', minHeight: '4.5rem', height: '4.5rem', overflowY: 'auto' }}
                >
                  {project.description || (
                    <span className="text-gray-400">Add description here...</span>
                  )}
                </p>
              )}
              {/* Tags removed, but space preserved by increased minHeight above */}
            </div>
          </div>

          {/* Navigation Header */}
          <div className="flex items-center gap-6 mb-4">
            {/* Questions tab - always visible */}
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
            
            {/* Other tabs - visible when questions are done (optimistic or confirmed) */}
            {(project?.questions_done || optimisticQuestionsDone) && (
              <>
                <button 
                  onClick={() => {
                    console.log('🔄 Expert List button clicked, switching section');
                    setCurrentSection('expert-list');
                  }}
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
              </>
            )}
          </div>
          
          {/* Horizontal divider */}
          <div className="border-b border-gray-400 mb-4"></div>

          {/* Section Content */}
          <div className="h-[calc(100vh-276px)] overflow-hidden">
            {currentSection === 'expert-list' && <ExpertList />}
            {currentSection === 'questions' && <Questions questionsDone={project?.questions_done || optimisticQuestionsDone} />}
            {currentSection === 'insights' && <Insights />}
            {currentSection === 'financial' && <Financial />}
          </div>
        </div>
      </div>
    </VoiceProvider>
  );
} 