import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Message } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatMessageProps {
  message: Message;
  onSpeakMessage: (text: string) => void;
}

const ChatMessage = ({ message, onSpeakMessage }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [formattedContent, setFormattedContent] = useState<string>(message.content);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [showKeyPoints, setShowKeyPoints] = useState<boolean>(false);
  
  // Extract key points from the message
  const extractKeyPoints = (content: string): string[] => {
    const points: string[] = [];
    
    // Extract bold text
    const boldMatches = content.match(/\*\*(.*?)\*\*/g);
    if (boldMatches) {
      boldMatches.forEach(match => {
        const cleanPoint = match.replace(/\*\*/g, '').trim();
        if (cleanPoint && cleanPoint.length > 3 && !points.includes(cleanPoint)) {
          points.push(cleanPoint);
        }
      });
    }
    
    // Extract numbered points
    const numberedMatches = content.match(/\d+\.\s+([^\n]+)/g);
    if (numberedMatches) {
      numberedMatches.forEach(match => {
        const cleanPoint = match.trim();
        if (cleanPoint && !points.includes(cleanPoint)) {
          points.push(cleanPoint);
        }
      });
    }
    
    // Extract section headers that end with ":"
    const headerMatches = content.match(/^[A-Z][^:]*:/gm);
    if (headerMatches) {
      headerMatches.forEach(match => {
        const cleanPoint = match.trim();
        if (cleanPoint && !points.includes(cleanPoint)) {
          points.push(cleanPoint);
        }
      });
    }
    
    // Extract emoji-led points
    // Using a simplified emoji detection approach that works with ES5
    const emojiLines = content.split('\n').filter(line => 
      line.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/) && line.includes(':')
    );
    
    emojiLines.forEach(line => {
      const cleanPoint = line.trim();
      if (cleanPoint && !points.includes(cleanPoint) && cleanPoint.length > 5) {
        points.push(cleanPoint);
      }
    });
    
    return points.slice(0, 5); // Limit to top 5 key points
  };
  
  // Process message content to highlight important points
  useEffect(() => {
    if (!isUser) {
      // Highlight headings and key points
      let content = message.content;
      
      // Highlight bold text (already in markdown format)
      content = content.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-[#6A2C91]">$1</span>');
      
      // Highlight numbered points (1., 2., etc.)
      content = content.replace(/(\d+\.\s+)([^\n]+)/g, '$1<span class="font-semibold text-[#6A2C91]">$2</span>');
      
      // Highlight bullet points
      content = content.replace(/(\*\s+)([^\n]+)/g, '$1<span class="font-semibold">$2</span>');
      
      // Process emoji lines to highlight them
      const lines = content.split('\n');
      const processedLines = lines.map(line => {
        // Detect if line has emoji (using surrogate pair detection)
        if (line.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/)) {
          if (line.includes(':')) {
            // This is likely a heading with emoji and colon
            return line.replace(/(.*?:)/, '<span class="font-semibold text-[#6A2C91]">$1</span>');
          } else {
            // This is a line with emoji but no colon
            return '<span class="font-medium">' + line + '</span>';
          }
        }
        return line;
      });
      
      content = processedLines.join('\n');
      
      setFormattedContent(content);
      
      // Extract key points for the summary dialog
      setKeyPoints(extractKeyPoints(message.content));
    } else {
      setFormattedContent(message.content);
    }
  }, [message.content, isUser]);

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
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-line">{formattedContent}</p>
        ) : (
          <p 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        )}
        
        {!isUser && (
          <div className="text-xs text-right text-neutral-700/50 mt-3 flex justify-end items-center gap-2">
            {keyPoints.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto text-[#6A2C91]/70 hover:text-[#6A2C91] transition-colors flex items-center"
                  >
                    <i className="ri-lightbulb-flash-line mr-1 text-amber-500"></i>
                    <span className="text-xs">Key Points</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-[#6A2C91]">💡 Key Points</DialogTitle>
                    <DialogDescription>
                      Important highlights from Asha's response
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-2">
                    {keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-purple-50">
                        <div className="w-5 h-5 bg-[#6A2C91] rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-800">{point}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto hover:text-[#6A2C91] transition-colors"
              onClick={() => onSpeakMessage(message.content)}
              title="Listen to response"
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
