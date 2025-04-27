import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sessionId: string;
}

interface ChatMessageProps {
  message: Message;
  onSpeakMessage: (text: string) => void;
}

const ChatMessage = ({ message, onSpeakMessage }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'self-end' : 'self-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#6A2C91] flex items-center justify-center text-white flex-shrink-0">
          <i className="ri-robot-2-line text-sm"></i>
        </div>
      )}
      
      <div className={`relative chat-bubble-tail ${isUser ? 'chat-bubble-user bg-[#6A2C91]/10 rounded-t-lg rounded-l-lg' : 'chat-bubble-assistant bg-neutral-100 rounded-t-lg rounded-r-lg'} p-3 shadow-sm`}>
        <p className="text-sm">{message.content}</p>
        
        {!isUser && (
          <div className="text-xs text-right text-neutral-700/50 mt-1">
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
        <div className="w-8 h-8 rounded-full bg-[#FF9933]/80 flex items-center justify-center text-white flex-shrink-0">
          <i className="ri-user-3-line text-sm"></i>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
