import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import VoiceButton from "./voice-button";
import useSpeechRecognition from "@/hooks/use-speech-recognition";

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
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  return (
    <div className="p-5 border-t border-neutral-200 bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white rounded-md border border-neutral-300 flex items-center px-4 py-3 focus-within:border-[#6A2C91]/60 focus-within:ring-2 focus-within:ring-[#6A2C91]/20 transition-all shadow-sm">
          <input 
            ref={inputRef}
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-neutral-700/50 font-medium"
            placeholder={isListening ? "Listening..." : "Enter your professional inquiry..."}
            disabled={isLoading || isListening}
          />
          <Button 
            onClick={handleSendMessage}
            variant="ghost"
            size="sm"
            disabled={!message.trim() || isLoading}
            className="text-neutral-700/70 hover:text-[#6A2C91] transition-colors ml-2 p-1 h-auto"
          >
            <i className="ri-send-plane-fill text-xl"></i>
          </Button>
        </div>
        <VoiceButton 
          isListening={isListening} 
          onClick={toggleVoiceInput}
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-between items-center mt-3 px-1">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 text-xs font-medium text-[#6A2C91]/80 border-[#6A2C91]/20 hover:bg-[#6A2C91]/5"
            onClick={onToggleTts}
          >
            <i className={`${isTtsEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line'}`}></i>
            <span>{isTtsEnabled ? "Audio Enabled" : "Audio Disabled"}</span>
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 text-xs font-medium text-neutral-700/80 border-neutral-300/80 hover:bg-neutral-100"
            onClick={onClearChat}
          >
            <i className="ri-delete-bin-line"></i>
            <span>Clear Conversation</span>
          </Button>
        </div>
        <div className="flex items-center">
          <span className="text-xs font-medium text-neutral-600">Powered by JobsForHer Foundation</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
