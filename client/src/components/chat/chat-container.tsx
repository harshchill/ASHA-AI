import { useEffect, useRef } from "react";
import ChatMessage from "./chat-message";
import WelcomeMessage from "./welcome-message";
import { useToast } from "@/hooks/use-toast";
import useTextToSpeech from "@/hooks/use-text-to-speech";

import { Message } from "@/types";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isTtsEnabled: boolean;
  onSendMessage?: (text: string) => void;
}

const ChatContainer = ({ messages, isLoading, isTtsEnabled, onSendMessage }: ChatContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { speak } = useTextToSpeech();
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Commenting out automatic TTS to prevent repeated voice playback
  // useEffect(() => {
  //   if (messages.length > 0 && isTtsEnabled) {
  //     const lastMessage = messages[messages.length - 1];
  //     if (lastMessage.role === "assistant") {
  //       speak(lastMessage.content);
  //     }
  //   }
  // }, [messages, isTtsEnabled, speak]);

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
        <WelcomeMessage onSuggestionClick={(text) => onSendMessage?.(text)} />
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6A2C91] to-[#4A1D71] flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <i className="ri-customer-service-2-line text-sm"></i>
          </div>
          <div className="relative">
            <div className="typing-indicator px-5 py-4 bg-white rounded-t-lg rounded-r-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">💭</span>
                <span className="text-xs font-medium text-gray-700">Preparing professional response</span>
              </div>
              <div className="flex mt-1">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
