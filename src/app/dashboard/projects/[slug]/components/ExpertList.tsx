"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Expert {
  id: string;
  name: string;
  headline: string;
  linkedin_url: string;
  rank?: number;
}

// Expert Card Component
const ExpertCard = ({ 
  name, 
  title, 
  onClick 
}: { 
  name: string; 
  title: string; 
  onClick: () => void;
}) => (
  <div 
    className="bg-black/5 border border-black/20 rounded-2xl p-4 cursor-pointer hover:bg-black/10 transition-colors"
    onClick={onClick}
  >
    <h4 className="font-primary font-semibold text-sm text-black mb-1">
      {name}
    </h4>
    <p className="font-secondary text-xs text-gray-600">
      {title}
    </p>
  </div>
);

export default function ExpertList() {
  const params = useParams();
  const projectSlug = params.slug as string;
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [hasExceededLimit, setHasExceededLimit] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_POLLS = 20;

  // Get project ID from slug
  useEffect(() => {
    async function fetchProjectId() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: project, error } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', projectSlug)
          .eq('investor_id', user.id)
          .single();

        if (!error && project) {
          setProjectId(project.id);
        }
      } catch (error) {
        console.error('Error fetching project ID:', error);
      }
    }

    if (projectSlug) {
      fetchProjectId();
    }
  }, [projectSlug]);

  // Function to fetch experts from database
  const fetchExperts = useCallback(async (showLoading = true) => {
    if (!projectId) return;

    try {
      if (showLoading) setLoading(true);
      
      const { data: expertsData, error } = await supabase
        .from('experts')
        .select('id, name, headline, linkedin_url, rank')
        .eq('project_id', projectId)
        .order('rank', { ascending: true });

      if (error) {
        console.error('Error fetching experts:', error);
        setExperts([]);
      } else {
        const fetchedExperts = expertsData || [];
        setExperts(fetchedExperts);
        
        // If we found experts and were polling, stop polling
        if (fetchedExperts.length > 0 && isPolling) {
          console.log('Experts found! Stopping polling.');
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
        
        // If no experts found and not already polling and haven't exceeded limit, start polling
        if (fetchedExperts.length === 0 && !isPolling && !loading && !hasExceededLimit) {
          console.log('No experts found. Starting polling every 30 seconds...');
          setIsPolling(true);
          setPollCount(0); // Reset poll count when starting fresh
        }
      }
    } catch (error) {
      console.error('Error fetching experts:', error);
      setExperts([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [projectId, isPolling, loading, hasExceededLimit]);

  // Fetch experts when project ID is available
  useEffect(() => {
    if (projectId) {
      fetchExperts();
    }
  }, [projectId, fetchExperts]);

  // Set up polling when isPolling becomes true
  useEffect(() => {
    if (isPolling && projectId && !hasExceededLimit) {
      pollingIntervalRef.current = setInterval(() => {
        const currentCount = pollCount + 1;
        console.log(`Polling for experts... (attempt ${currentCount}/${MAX_POLLS})`);
        
        if (currentCount >= MAX_POLLS) {
          console.log('Polling limit exceeded. Stopping polling and showing error message.');
          setIsPolling(false);
          setHasExceededLimit(true);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }
        
        setPollCount(currentCount);
        fetchExperts(false); // Don't show loading during polling
      }, 30000); // 30 seconds

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [isPolling, projectId, hasExceededLimit, pollCount, fetchExperts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const handleExpertClick = (linkedinUrl: string) => {
    if (linkedinUrl) {
      window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <div className="h-full flex gap-4">
      {/* Column 1 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Experts Identified {!loading && experts.length > 0 && `(${experts.length})`}
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Expert Cards */}
        <div className="px-4 pb-4 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">Loading experts...</div>
            </div>
          ) : experts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    hasExceededLimit 
                      ? 'bg-red-100' 
                      : 'bg-[rgba(75,46,182,0.1)]'
                  }`}>
                    {hasExceededLimit ? (
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-[#502CBD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                {hasExceededLimit ? (
                  <>
                    <div className="text-gray-700 font-medium text-sm mb-1">Currently experiencing issues.</div>
                    <div className="text-gray-700 font-medium text-sm">Please contact support.</div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-700 font-medium text-sm mb-1">Deep search in progress.</div>
                    <div className="text-gray-700 font-medium text-sm">Check back soon.</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto space-y-3 custom-scrollbar-experts">
              {experts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  name={expert.name}
                  title={expert.headline}
                  onClick={() => handleExpertClick(expert.linkedin_url)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Column 2 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Outreach
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Cards container */}
        <div className="px-4 pb-4 flex-1 space-y-3">
          {/* Cards will go here */}
        </div>
      </div>
      
      {/* Column 3 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Book an insight call
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Cards container */}
        <div className="px-4 pb-4 flex-1 space-y-3">
          {/* Cards will go here */}
        </div>
      </div>
      
      {/* Column 4 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Received Insights
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Cards container */}
        <div className="px-4 pb-4 flex-1 space-y-3">
          {/* Cards will go here */}
        </div>
      </div>
    </div>
  );
}

// Add custom scrollbar styles matching Questions component
const styles = `
.custom-scrollbar-experts::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar-experts::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-experts::-webkit-scrollbar-thumb {
  background: #502CBD;
  border-radius: 2px;
}

.custom-scrollbar-experts::-webkit-scrollbar-thumb:hover {
  background: #4A26B3;
}

/* Firefox scrollbar */
.custom-scrollbar-experts {
  scrollbar-width: thin;
  scrollbar-color: #502CBD transparent;
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  if (!document.head.querySelector('style[data-experts-scrollbar]')) {
    styleElement.setAttribute('data-experts-scrollbar', 'true');
    document.head.appendChild(styleElement);
  }
} 