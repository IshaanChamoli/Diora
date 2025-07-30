"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

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
          console.error('Project fetch error:', projectError);
          // Redirect to dashboard if project not found
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
      <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-primary font-semibold text-black mb-4">
            Loading project...
          </div>
        </div>
      </div>
    );
  }

  // If no project found, show loading (will redirect)
  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-primary font-semibold text-black mb-4">
            Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white flex">
      {/* Universal Sidebar with current project info */}
      <Sidebar 
        currentProjectSlug={project.slug}
        currentProjectName={project.name}
      />
      
      {/* Main content area */}
      <div className="flex-1 p-8">
        {/* Project Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h1 className="font-primary font-semibold text-2xl text-black mb-2">
            {project.name}
          </h1>
          <p className="font-secondary text-gray-600 mb-4">
            {project.description || 'No description available'}
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-[rgba(80,44,189,0.1)] text-[rgb(75,46,182)] rounded-full text-xs font-medium">
              New Project
            </span>
          </div>
        </div>

        {/* Project Sections */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-primary font-semibold text-lg text-black mb-4">
            Project Sections
          </h2>
          <p className="font-secondary text-gray-600">
            This is where the different sections (Experts, Questions, Insights, Financial) will be implemented.
          </p>
        </div>
      </div>
    </div>
  );
} 