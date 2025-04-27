import { useEffect, useRef } from "react";
import ChatMessage from "./chat-message";
import WelcomeMessage from "./welcome-message";
import { useToast } from "@/hooks/use-toast";
import useTextToSpeech from "@/hooks/use-text-to-speech";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string | Date;
  sessionId: string;
}

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isTtsEnabled: boolean;
}

const ChatContainer = ({ messages, isLoading, isTtsEnabled }: ChatContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { speak } = useTextToSpeech();
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Speak latest assistant message if TTS is enabled
  useEffect(() => {
    if (messages.length > 0 && isTtsEnabled) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        speak(lastMessage.content);
      }
    }
  }, [messages, isTtsEnabled, speak]);

  const handleSpeakMessage = (text: string) => {
    speak(text);
    toast({
      title: "Speaking",
      description: "Text-to-speech activated",
      duration: 2000,
    });
  };

  return (
    <div 
      ref={containerRef} 
      className="chat-container overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-4 h-[calc(100vh-160px)] md:h-[calc(100vh-160px)]"
      style={{
        scrollBehavior: "smooth"
      }}
    >
      {/* Show welcome message if no messages yet */}
      {messages.length === 0 && (
        <WelcomeMessage onSuggestionClick={() => {}} />
      )}

      {/* Render all messages */}
      {messages.map((message) => (
        <ChatMessage 
          key={message.id} 
          message={message} 
          onSpeakMessage={handleSpeakMessage}
        />
      ))}

      {/* Typing indicator when loading */}
      {isLoading && (
        <div className="flex items-end gap-2 max-w-[85%] self-start">
          <div className="w-8 h-8 rounded-full bg-[#6A2C91] flex items-center justify-center text-white flex-shrink-0">
            <i className="ri-robot-2-line text-sm"></i>
          </div>
          <div className="chat-bubble-assistant relative">
            <div className="typing-indicator px-4 py-3 bg-neutral-100 rounded-lg">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
