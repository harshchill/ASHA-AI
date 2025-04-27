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
    <div className="p-4 border-t border-neutral-200 bg-white sticky bottom-0 z-10">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-neutral-100 rounded-full border border-neutral-200 flex items-center px-4 py-2 focus-within:border-[#6A2C91]/50 focus-within:ring-2 focus-within:ring-[#6A2C91]/20 transition-all">
          <input 
            ref={inputRef}
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-neutral-700/50"
            placeholder={isListening ? "Listening..." : "Type your message here..."}
            disabled={isLoading || isListening}
          />
          <Button 
            onClick={handleSendMessage}
            variant="ghost"
            size="sm"
            disabled={!message.trim() || isLoading}
            className="text-neutral-700/70 hover:text-[#6A2C91] transition-colors ml-2 p-0 h-auto"
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
      <div className="flex justify-between items-center mt-2 text-xs text-neutral-700/60 px-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 p-1 h-auto hover:text-[#6A2C91] transition-colors"
            onClick={onToggleTts}
          >
            <i className={`${isTtsEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line'}`}></i>
            <span>TTS</span>
          </Button>
          <span className="text-neutral-700/30">|</span>
          <Button 
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 p-1 h-auto hover:text-[#6A2C91] transition-colors"
            onClick={onClearChat}
          >
            <i className="ri-delete-bin-line"></i>
            <span>Clear chat</span>
          </Button>
        </div>
        <div className="flex items-center">
          <span className="text-xs">Powered by JobsForHer Foundation</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
