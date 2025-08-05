"use client";

import { Plus, Pencil, MoreVertical } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import VoiceButton from "@/components/voice/VoiceButton";
import { useVoice } from "@/components/voice/VoiceProvider";
import { vapiService } from "@/lib/vapi";

export default function Questions() {
  const params = useParams();
  const projectSlug = params.slug as string;
  const { isCallActive } = useVoice();
  
  const [questions, setQuestions] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Save questions to database
  const saveQuestionsToDb = useCallback(async (updatedQuestions: string[]) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ questions: updatedQuestions })
        .eq('slug', projectSlug);

      if (error) {
        console.error('Error saving questions:', error);
        // If update fails, try to create/initialize the questions column
        const { error: retryError } = await supabase
          .from('projects')
          .update({ questions: updatedQuestions })
          .eq('slug', projectSlug);
        
        if (retryError) {
          console.error('Retry error saving questions:', retryError);
        }
      }
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  }, [projectSlug]);

  // Control voice button collapsed state
  // You can customize this logic however you want!
  const isVoiceButtonCollapsed = isCallActive; // Collapse when call is active

  // Set the current project slug in Vapi service when component mounts
  useEffect(() => {
    if (projectSlug) {
      vapiService.setCurrentProjectSlug(projectSlug);
    }
  }, [projectSlug]);

  // Initialize Vapi service
  useEffect(() => {
    vapiService.setCurrentProjectSlug(projectSlug);
    vapiService.setOnAddQuestionCallback((questionText: string) => {
      // Add the question to the UI state
      setQuestions(prevQuestions => {
        const newQuestions = [...prevQuestions, questionText];
        // Save to database in background
        saveQuestionsToDb(newQuestions);
        return newQuestions;
      });
    });

    // Set up callback for voice tool calls to delete questions from UI
    vapiService.setOnDeleteQuestionCallback((questionIndex: number) => {
      // Delete the question from the UI state
      setQuestions(prevQuestions => {
        const newQuestions = prevQuestions.filter((_, index) => index !== questionIndex);
        // Save to database in background
        saveQuestionsToDb(newQuestions);
        return newQuestions;
      });
    });

    // Cleanup callback when component unmounts
    return () => {
      vapiService.setOnAddQuestionCallback(() => {});
      vapiService.setOnDeleteQuestionCallback(() => {});
    };
  }, [saveQuestionsToDb, projectSlug]);

  // Load questions from database on component mount
  useEffect(() => {
    async function loadQuestions() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('questions')
          .eq('slug', projectSlug)
          .single();

        if (error) {
          console.error('Error loading questions:', error);
          // If project doesn't exist yet or questions column is null, start with empty array
          setQuestions([]);
          setLoading(false);
          return;
        }

        setQuestions(data?.questions || []);
      } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to empty array if any error occurs
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    if (projectSlug) {
      loadQuestions();
    }
  }, [projectSlug]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const handleAddQuestion = () => {    
    const newIndex = questions.length;
    const newQuestions = [...questions, ""];
    setQuestions(newQuestions);
    setEditingIndex(newIndex);
    setEditingText("");
    
    // Save immediately to initialize questions array in database
    if (projectSlug) {
      saveQuestionsToDb(newQuestions);
    }
  };

  const handleSaveQuestion = async (index: number) => {
    const originalText = questions[index] || "";
    const newText = editingText.trim();
    
    // Immediately update UI state for smooth experience
    setEditingIndex(null);
    setEditingText("");
    
    // Check if text actually changed
    if (newText === originalText) {
      // No change, don't update database
      return;
    }
    
    // Always update the question at the same index, never delete
    const updatedQuestions = [...questions];
    updatedQuestions[index] = newText; // Keep empty string if newText is empty
    setQuestions(updatedQuestions);
    
    // Save to database in background
    await saveQuestionsToDb(updatedQuestions);
  };

  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
    setEditingText(questions[index]);
  };

  const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveQuestion(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditingText("");
    }
  };

  const handleDropdownToggle = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const handleDeleteQuestion = async (indexToDelete: number) => {
    // Close the dropdown first
    setOpenDropdown(null);
    
    // Remove the question at the specific index
    const updatedQuestions = questions.filter((_, index) => index !== indexToDelete);
    
    // Update local state immediately for smooth UI
    setQuestions(updatedQuestions);
    
    // Handle editing state adjustments to prevent index mismatches
    if (editingIndex !== null) {
      if (editingIndex === indexToDelete) {
        // If we're deleting the question being edited, exit edit mode
        setEditingIndex(null);
        setEditingText("");
      } else if (editingIndex > indexToDelete) {
        // If we're editing a question after the deleted one, adjust the index down by 1
        setEditingIndex(editingIndex - 1);
      }
      // If editingIndex < indexToDelete, no adjustment needed
    }
    
    // Save updated array to database
    await saveQuestionsToDb(updatedQuestions);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-t-2xl h-full shadow-sm flex items-center justify-center">
        <div className="text-gray-500">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-t-2xl h-full shadow-sm flex flex-col relative">
      {/* Header with title and button */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-primary font-semibold text-xl text-black">
          My Questions
        </h2>
        <button 
          onClick={handleAddQuestion}
          className="flex items-center gap-2 bg-[#502CBD] text-white px-4 py-2 rounded-lg hover:bg-[#4A26B3] transition-colors"
        >
          Add Question
          <Plus className="w-4 h-4 stroke-3" />
        </button>
      </div>

      {/* Content Area */}
      {questions.length === 0 ? (
        // Empty state content - exactly as it was before
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[rgba(75,46,182,0.1)] rounded-full flex items-center justify-center">
                <Pencil className="w-6 h-6 text-[rgb(75,46,182)]" />
              </div>
            </div>
            <h3 className="font-primary font-medium text-base text-gray-700 mb-1">
              I&apos;m able to find you the best experts
            </h3>
            <p className="font-primary font-medium text-base text-gray-700 mb-3">
              when I understand your open questions.
            </p>
            <p className="font-secondary text-xs text-gray-500">
              You can update questions with voice or text.
            </p>
          </div>
        </div>
      ) : (
        // Questions list
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {questions.map((question, index) => (
              <div key={index} className={`border rounded-2xl p-4 bg-black/5 ${editingIndex === index ? 'border-[#502CBD]' : 'border-black/20'}`}>
                {editingIndex === index ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                      <div className="relative">
                        <button
                          onClick={(e) => handleDropdownToggle(index, e)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {openDropdown === index && (
                          <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                handleDeleteQuestion(index);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onBlur={() => handleSaveQuestion(index)}
                      className="w-full bg-transparent text-gray-700 focus:outline-none resize-none overflow-hidden"
                      placeholder="Type your question here..."
                      autoFocus
                      style={{
                        minHeight: '1.25rem',
                        height: '1.25rem',
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = '1.25rem';
                        const scrollHeight = target.scrollHeight;
                        target.style.height = scrollHeight + 'px';
                      }}
                      onFocus={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        // Position cursor at the end
                        const length = target.value.length;
                        target.setSelectionRange(length, length);
                        // Set proper height for existing content
                        target.style.height = '1.25rem';
                        const scrollHeight = target.scrollHeight;
                        target.style.height = scrollHeight + 'px';
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleEditQuestion(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                      <div className="relative">
                        <button
                          onClick={(e) => handleDropdownToggle(index, e)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {openDropdown === index && (
                          <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                handleDeleteQuestion(index);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 break-words whitespace-pre-wrap">
                      {question || (
                        <span className="text-gray-400">Type your question here...</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Button - positioned in bottom right corner */}
      <div className="absolute bottom-4 right-4">
        <VoiceButton 
          agentType="questions"
          collapsed={isVoiceButtonCollapsed}
          customStyles={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 50
          }}
        />
      </div>
    </div>
  );
}

// Add custom scrollbar styles
const styles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #502CBD;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4A26B3;
}

/* Firefox scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #502CBD transparent;
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  if (!document.head.querySelector('style[data-questions-scrollbar]')) {
    styleElement.setAttribute('data-questions-scrollbar', 'true');
    document.head.appendChild(styleElement);
  }
} 