"use client";

import Image from "next/image";
import { useVoice } from "./VoiceProvider";
import { vapiService } from "@/lib/vapi";

interface VoiceButtonProps {
  width?: number;
  agentType?: 'questions' | 'experts' | 'insights' | 'dashboard';
  customStyles?: React.CSSProperties;
  collapsed?: boolean; // New prop to control collapsed state
}

export default function VoiceButton({ 
  width = 48, 
  agentType = 'questions',
  customStyles = {},
  collapsed = false
}: VoiceButtonProps) {
  const { isCallActive, startCall, endCall } = useVoice();

  const handleVoiceClick = async () => {
    if (isCallActive) {
      await vapiService.endCall();
      endCall();
    } else {
      await vapiService.startCall(agentType);
      startCall(agentType);
    }
  };

  // When collapsed, just show the gif by itself
  if (collapsed) {
    return (
      <button
        onClick={handleVoiceClick}
        className="transition-all duration-200 hover:scale-105"
        style={customStyles}
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
    );
  }

  // When not collapsed, show the full button with text
  return (
    <div className="flex items-center gap-3" style={customStyles}>
      {/* Text button */}
      <button
        onClick={handleVoiceClick}
        className={`bg-white rounded-full px-3 py-1.5 transition-all duration-200 shadow-xl hover:shadow-xl hover:bg-gray-50 flex items-center justify-center ${
          isCallActive 
            ? 'bg-purple-100 hover:bg-purple-200' 
            : ''
        }`}
      >
        <span className="text-xs font-primary font-medium text-gray-700">
          {isCallActive ? 'End Call' : 'Speak to Diora'}
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