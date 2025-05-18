import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import VoiceButton from "./voice-button";
import useSpeechRecognition from "@/hooks/use-speech-recognition";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCareerConfidence } from "@/contexts/CareerConfidenceContext";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  isTtsEnabled: boolean;
  onToggleTts: () => void;
  isLoading: boolean;
}

const ChatInput = ({ 
  onSendMessage, 
  onClearChat, 
  isTtsEnabled, 
  onToggleTts,
  isLoading 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language, t } = useLanguage();
  const { confidenceState, getResponseStyle } = useCareerConfidence();
  
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    hasRecognitionSupport
  } = useSpeechRecognition();

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  // Get contextual suggestions based on emotional state
  useEffect(() => {
    const { tone, emphasis } = getResponseStyle();
    const contextualSuggestions = {
      supportive: [
        "I'm feeling a bit overwhelmed with...",
        "Can you help me understand...",
        "I'm not sure how to approach..."
      ],
      practical: [
        "What are the steps to...",
        "How can I improve my...",
        "Could you explain the process of..."
      ],
      motivational: [
        "I want to achieve...",
        "My career goal is to...",
        "I'm looking to grow in..."
      ]
    };
    
    setSuggestions(contextualSuggestions[tone] || contextualSuggestions.practical);
  }, [getResponseStyle]);

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!hasRecognitionSupport) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    if (isListening) {
      stopListening();
      if (transcript) {
        setMessage(transcript);
        // Focus on input after voice input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } else {
      startListening();
    }
  };

  // Show suggestions when input is focused and empty
  const handleInputFocus = () => {
    if (!message) {
      setShowSuggestions(true);
    }
  };

  // Hide suggestions when input is blurred
  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't hide if clicking on a suggestion
    if ((e.relatedTarget as HTMLElement)?.closest('.suggestions-popover')) {
      return;
    }
    setShowSuggestions(false);
  };

  // Use a suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="p-5 border-t border-neutral-200 bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3">
        <Popover open={showSuggestions}>
          <PopoverTrigger asChild>
            <div className="flex-1 bg-white rounded-md border border-neutral-300 flex items-center px-4 py-3 focus-within:border-[#6A2C91]/60 focus-within:ring-2 focus-within:ring-[#6A2C91]/20 transition-all shadow-sm">
              {isListening && (
                <div className="flex items-center justify-center animate-pulse mr-2">
                  <i className="ri-mic-fill text-red-500"></i>
                </div>
              )}
              <input 
                ref={inputRef}
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder-neutral-700/50 font-medium"
                placeholder={isListening ? "Listening..." : t('inputPlaceholder')}
                disabled={isLoading || isListening}
              />
              <Button 
                onClick={handleSendMessage}
                variant="ghost"
                size="sm"
                disabled={!message.trim() || isLoading}
                className={`ml-2 p-1 h-auto transition-colors ${
                  !message.trim() || isLoading ? 'text-neutral-400' : 
                  confidenceState.emotionalState.tone === 'supportive' ? 'text-purple-600 hover:text-purple-700' :
                  confidenceState.emotionalState.tone === 'motivational' ? 'text-blue-600 hover:text-blue-700' :
                  'text-[#6A2C91] hover:text-[#9D5CC2]'
                }`}
              >
                <i className="ri-send-plane-fill text-xl"></i>
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="suggestions-popover w-[calc(100vw-40px)] sm:w-[500px] p-3"
            align="start"
          >
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-700">Suggested questions:</h4>
              <div className="grid gap-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left px-3 py-2 text-sm rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          {hasRecognitionSupport && (
            <VoiceButton
              isListening={isListening}
              onClick={toggleVoiceInput}
              disabled={isLoading}
            />
          )}
          <Button
            onClick={onToggleTts}
            variant="ghost"
            size="icon"
            className={`transition-colors ${
              isTtsEnabled ? 'text-[#6A2C91]' : 'text-neutral-400'
            }`}
          >
            <i className={`ri-${isTtsEnabled ? 'volume-up' : 'volume-mute'}-fill text-xl`}></i>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
