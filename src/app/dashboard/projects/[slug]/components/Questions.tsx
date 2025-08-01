import { Plus, Pencil } from "lucide-react";
import { useState } from "react";

export default function Questions() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAddQuestion = () => {
    const newIndex = questions.length;
    setQuestions([...questions, ""]);
    setEditingIndex(newIndex);
    setEditingText("");
  };

  const handleSaveQuestion = (index: number) => {
    if (editingText.trim()) {
      const updatedQuestions = [...questions];
      updatedQuestions[index] = editingText.trim();
      setQuestions(updatedQuestions);
    } else {
      // Remove empty question
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
    }
    setEditingIndex(null);
    setEditingText("");
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

  return (
    <div className="bg-white rounded-t-2xl h-full shadow-sm">
      {/* Header with title and button */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="font-primary font-semibold text-xl text-black">
          My Questions
        </h2>
        <button 
          onClick={handleAddQuestion}
          className="flex items-center gap-2 bg-[rgb(75,46,182)] text-white px-4 py-2 rounded-lg hover:bg-[rgb(65,36,172)] transition-colors"
        >
          Add Question
          <Plus className="w-4 h-4 stroke-3" />
        </button>
      </div>

      {/* Content Area */}
      {questions.length === 0 ? (
        // Empty state content - exactly as it was before
        <div className="flex flex-col items-center justify-center h-full -mt-12">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[rgba(75,46,182,0.1)] rounded-full flex items-center justify-center">
                <Pencil className="w-6 h-6 text-[rgb(75,46,182)]" />
              </div>
            </div>
            <h3 className="font-primary font-medium text-base text-gray-700 mb-1">
              I'm able to find you the best experts
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
        <div className="p-6 space-y-3">
          {questions.map((question, index) => (
            <div key={index} className={`border rounded-lg p-4 bg-gray-50 ${editingIndex === index ? 'border-[rgb(75,46,182)]' : 'border-gray-200'}`}>
              {editingIndex === index ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
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
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 break-words whitespace-pre-wrap">
                    {question || "Click to edit question..."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 