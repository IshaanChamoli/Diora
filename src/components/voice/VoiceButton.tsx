"use client";

import Image from "next/image";
import { useVoice } from "./VoiceProvider";
import { vapiService } from "@/lib/vapi";
import { HelpCircle, Phone, Mic, MicOff, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface VoiceButtonProps {
  width?: number;
  agentType?: 'questions' | 'experts' | 'insights' | 'dashboard';
  customStyles?: React.CSSProperties;
  collapsed?: boolean; // New prop to control collapsed state
  projectSlug?: string; // New prop for navigation to experts
  forceShowContinue?: boolean; // Force continue button regardless of env variable
}

export default function VoiceButton({ 
  width = 40, 
  agentType = 'questions',
  customStyles = {},
  collapsed = false,
  projectSlug,
  forceShowContinue = false
}: VoiceButtonProps) {
  const { isCallActive, startCall, endCall, userFirstName, projectId } = useVoice();
  const [isMuted, setIsMuted] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const gifRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  
  // Check if continue button is enabled via environment variable OR forced by prop
  const isContinueMode = process.env.NEXT_PUBLIC_VOICE_CONTINUE_BUTTON === 'true' || forceShowContinue;

  const handleVoiceClick = async () => {
    // If in continue mode, end call first then navigate to experts section
    if (isContinueMode && projectSlug) {
      // End call if one is active
      if (isCallActive) {
        await vapiService.endCall();
        endCall();
        setShowOptions(false);
      }
      // Navigate to experts section - use replace to ensure proper navigation
      console.log('🎯 Continue button clicked, navigating to experts for project:', projectSlug);
      
      // Immediately fire event for optimistic UI update
      window.dispatchEvent(new CustomEvent('continueButtonClicked'));
      
      // First, update questions_done to true in the database
      try {
        const { error } = await supabase
          .from('projects')
          .update({ questions_done: true })
          .eq('slug', projectSlug);

        if (error) {
          console.error('Error updating questions_done:', error);
        } else {
          console.log('✅ Questions marked as done for project:', projectSlug);
        }
      } catch (error) {
        console.error('Exception updating questions_done:', error);
      }
      
      // Force navigation with both URL and direct section setting
      const targetUrl = `/dashboard/projects/${projectSlug}?section=expert-list`;
      router.replace(targetUrl);
      
      // Also trigger events to update the project state and force section change
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceExpertSection'));
        window.dispatchEvent(new CustomEvent('updateProjectData'));
      }, 50);
      return;
    }
    
    // Normal voice button behavior
    if (!isCallActive) {
      // Inactive → Active + show options immediately
      await vapiService.startCall(agentType, {
        first_name: userFirstName || 'there',
        project_id: projectId || 'unknown'
      });
      startCall(agentType);
      setShowOptions(true);
    } else if (!showOptions) {
      // Active + no options → show options
      setShowOptions(true);
    } else {
      // Active + options showing → hide options
      setShowOptions(false);
    }
  };

  const handleEndCall = async () => {
    await vapiService.endCall();
    endCall();
    setShowOptions(false);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality with Vapi
  };

  // Handle clicking outside to close options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (optionsRef.current && !optionsRef.current.contains(target) && 
          gifRef.current && !gifRef.current.contains(target)) {
        setShowOptions(false);
      }
    };

    if (isCallActive && showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCallActive, showOptions]);

  // When collapsed, just show the gif by itself
  if (collapsed) {
    return (
      <div className="flex flex-col items-center" style={customStyles}>
        {/* Call options - only show when call is active and options are open */}
        {isCallActive && showOptions && (
          <div ref={optionsRef} className="flex flex-col items-center gap-3 mb-3">
            {/* Help */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 w-full max-w-[200px]">
              <button className="bg-white rounded-full px-3 py-1.5 transition-all duration-200 shadow-xl hover:shadow-xl hover:bg-gray-50 flex items-center justify-center border border-black justify-self-end">
                <span className="text-xs font-primary font-medium text-gray-700">
                  Help
                </span>
              </button>
              <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border border-[#502CBD]">
                <HelpCircle className="w-5 h-5 text-[#502CBD]" />
              </div>
            </div>
            
            {/* End Call */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 w-full max-w-[200px]">
              <button className="bg-white rounded-full px-3 py-1.5 transition-all duration-200 shadow-xl hover:shadow-xl hover:bg-gray-50 flex items-center justify-center border border-black justify-self-end">
                <span className="text-xs font-primary font-medium text-gray-700">
                  End Call
                </span>
              </button>
              <button 
                onClick={handleEndCall}
                className="w-10 h-10 bg-[#FF0000] rounded-full shadow-xl flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Mute Mic */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 w-full max-w-[200px]">
              <button className="bg-white rounded-full px-3 py-1.5 transition-all duration-200 shadow-xl hover:shadow-xl hover:bg-gray-50 flex items-center justify-center border border-black justify-self-end">
                <span className="text-xs font-primary font-medium text-gray-700">
                  Mute Mic
                </span>
              </button>
              <button 
                onClick={handleMuteToggle}
                className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors border border-[#502CBD]"
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-[#502CBD]" />
                ) : (
                  <Mic className="w-5 h-5 text-[#502CBD]" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Continue button - show text and icon horizontally when continue mode AND options not visible */}
        {isContinueMode && !showOptions ? (
          <div className="flex items-center gap-3 justify-end w-full max-w-[200px]">
            {/* Text button */}
            <button
              onClick={handleVoiceClick}
              className="bg-white rounded-full px-3 py-1.5 transition-all duration-200 shadow-xl hover:shadow-xl hover:bg-gray-50 flex items-center justify-center border border-black"
            >
              <span className="text-xs font-primary font-medium text-gray-700">
                Continue to Experts
              </span>
            </button>
            
            {/* Icon button */}
            <button
              ref={gifRef}
              onClick={handleVoiceClick}
              className="transition-all duration-200 hover:scale-105"
            >
              <div 
                className="rounded-full bg-[#502CBD] flex items-center justify-center transition-all duration-200 hover:bg-[#4A26B3]"
                style={{ width: width, height: width }}
              >
                <ArrowRight className="text-white" style={{ width: width * 0.5, height: width * 0.5 }} />
              </div>
            </button>
          </div>
        ) : (
          /* Main button - shows arrow only when options visible, or GIF in voice mode */
          <div className="flex justify-end w-full max-w-[200px]">
            <button
              ref={gifRef}
              onClick={handleVoiceClick}
              className="transition-all duration-200 hover:scale-105"
            >
              {isContinueMode ? (
                <div 
                  className="rounded-full bg-[#502CBD] flex items-center justify-center transition-all duration-200 hover:bg-[#4A26B3]"
                  style={{ width: width, height: width }}
                >
                  <ArrowRight className="text-white" style={{ width: width * 0.5, height: width * 0.5 }} />
                </div>
              ) : (
                <Image
                  src="/ai-logo.gif"
                  alt="Diora AI Logo"
                  width={width}
                  height={width}
                  className={`rounded-full transition-all duration-200 ${isCallActive ? 'animate-pulse' : ''}`}
                  priority
                  unoptimized
                />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // When not collapsed, show the full button with text
  return (
    <div className="flex items-center gap-3" style={customStyles}>
      {/* Text button - shows "Continue to Experts" in continue mode */}
      <button
        onClick={handleVoiceClick}
        className="bg-white rounded-full px-3 py-1.5 transition-all duration-200 shadow-xl hover:shadow-xl hover:bg-gray-50 flex items-center justify-center border border-black"
      >
        <span className="text-xs font-primary font-medium text-gray-700">
          {isContinueMode ? "Continue to Experts" : "Speak to Diora"}
        </span>
      </button>
      
      {/* Icon button - shows arrow in continue mode, GIF otherwise */}
      <button
        onClick={handleVoiceClick}
        className="transition-all duration-200 hover:scale-105"
      >
        {isContinueMode ? (
          <div 
            className="rounded-full bg-[#502CBD] flex items-center justify-center transition-all duration-200 hover:bg-[#4A26B3]"
            style={{ width: width, height: width }}
          >
            <ArrowRight className="text-white" style={{ width: width * 0.5, height: width * 0.5 }} />
          </div>
        ) : (
          <Image
            src="/ai-logo.gif"
            alt="Diora AI Logo"
            width={width}
            height={width}
            className="rounded-full transition-all duration-200"
            priority
            unoptimized
          />
        )}
      </button>
    </div>
  );
} 