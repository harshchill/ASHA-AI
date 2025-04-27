import { Button } from "@/components/ui/button";

import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  onSpeakMessage: (text: string) => void;
}

const ChatMessage = ({ message, onSpeakMessage }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'self-end' : 'self-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#6A2C91] flex items-center justify-center text-white flex-shrink-0 shadow-md">
          <i className="ri-customer-service-2-line text-sm"></i>
        </div>
      )}
      
      <div className={`relative chat-bubble-tail ${
        isUser 
          ? 'chat-bubble-user bg-gradient-to-br from-[#6A2C91]/10 to-[#6A2C91]/5 rounded-t-lg rounded-l-lg border border-[#6A2C91]/10' 
          : 'chat-bubble-assistant bg-white rounded-t-lg rounded-r-lg border border-gray-200'
        } p-4 shadow-sm`}>
        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
        
        {!isUser && (
          <div className="text-xs text-right text-neutral-700/50 mt-2 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto hover:text-[#6A2C91] transition-colors"
              onClick={() => onSpeakMessage(message.content)}
            >
              <i className="ri-volume-up-line"></i>
            </Button>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FF8000] flex items-center justify-center text-white flex-shrink-0 shadow-md">
          <i className="ri-user-3-line text-sm"></i>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
