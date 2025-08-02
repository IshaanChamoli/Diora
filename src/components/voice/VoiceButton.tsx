"use client";

import Image from "next/image";
import { useVoice } from "./VoiceProvider";
import { vapiService } from "@/lib/vapi";
import { HelpCircle, Phone, Mic, MicOff } from "lucide-react";
import { useState } from "react";

interface VoiceButtonProps {
  width?: number;
  agentType?: 'questions' | 'experts' | 'insights' | 'dashboard';
  customStyles?: React.CSSProperties;
  collapsed?: boolean; // New prop to control collapsed state
}

export default function VoiceButton({ 
  width = 40, 
  agentType = 'questions',
  customStyles = {},
  collapsed = false
}: VoiceButtonProps) {
  const { isCallActive, startCall, endCall } = useVoice();
  const [isMuted, setIsMuted] = useState(false);

  const handleVoiceClick = async () => {
    if (isCallActive) {
      await vapiService.endCall();
      endCall();
    } else {
      await vapiService.startCall(agentType);
      startCall(agentType);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality with Vapi
  };

  // When collapsed, just show the gif by itself
  if (collapsed) {
    return (
      <div className="flex flex-col items-center" style={customStyles}>
        {/* Call options - 3 white circles above the GIF */}
        <div className="flex flex-col items-center gap-3 mb-3">
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
            <div className="w-10 h-10 bg-[#FF0000] rounded-full shadow-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
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
        
        {/* Main GIF button - aligned with circles above */}
        <div className="flex justify-end w-full max-w-[200px]">
          <button
            onClick={handleVoiceClick}
            className="transition-all duration-200 hover:scale-105"
          >
            <Image
              src="/ai-logo.gif"
              alt="Diora AI Logo"
              width={width}
              height={width}
              className={`rounded-full transition-all duration-200 ${isCallActive ? 'animate-pulse' : ''}`}
              priority
              unoptimized
            />
          </button>
        </div>
      </div>
    );
  }

  // When not collapsed, show the full button with text
  return (
    <div className="flex items-center gap-3" style={customStyles}>
      {/* Text button */}
      <button
        onClick={handleVoiceClick}
        className="bg-white rounded-full px-3 py-1.5 transition-all duration-200 shadow-xl hover:shadow-xl hover:bg-gray-50 flex items-center justify-center border border-black"
      >
        <span className="text-xs font-primary font-medium text-gray-700">
          Speak to Diora
        </span>
      </button>
      
      {/* Separate gif */}
      <button
        onClick={handleVoiceClick}
        className="transition-all duration-200 hover:scale-105"
      >
        <Image
          src="/ai-logo.gif"
          alt="Diora AI Logo"
          width={width}
          height={width}
          className="rounded-full transition-all duration-200"
          priority
          unoptimized
        />
      </button>
    </div>
  );
} 