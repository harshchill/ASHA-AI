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
import { 
  useCareerConfidence, 
  getColorSchemeForConfidence,
  getSupportivePhrase 
} from "@/contexts/CareerConfidenceContext";
import { theme } from "@/lib/theme";

interface ChatMessageProps {
  message: Message;
  onSpeakMessage: (text: string) => void;
}

const ChatMessage = ({ message, onSpeakMessage }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [formattedContent, setFormattedContent] = useState<string>(message.content);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const { confidenceState } = useCareerConfidence();
  const colorScheme = getColorSchemeForConfidence(confidenceState);
  
  // Get the color scheme and supportive text based on confidence level
  const supportivePhrase = getSupportivePhrase(confidenceState);
  
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
      let content = message.content;
      
      // Format link tags
      content = content.replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, 
        '<a href="$1" class="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">$2</a>'
      );
      
      // Format JSON blocks
      if (content.includes('```json')) {
        content = content.replace(/```json([\s\S]*?)```/g, (match, p1) => {
          try {
            const formatted = JSON.stringify(JSON.parse(p1), null, 2);
            return `<pre class="bg-gray-50 p-3 rounded-md overflow-x-auto"><code class="language-json">${formatted}</code></pre>`;
          } catch {
            return match;
          }
        });
      }
      
      // Format JSX/TSX blocks
      if (content.includes('```jsx') || content.includes('```tsx')) {
        content = content.replace(/```(jsx|tsx)([\s\S]*?)```/g, 
          '<pre class="bg-gray-50 p-3 rounded-md overflow-x-auto"><code class="language-typescript">$2</code></pre>'
        );
      }
      
      // Highlight key terms
      content = content.replace(/<span class="bot-highlight">(.*?)<\/span>/g,
        '<span class="font-semibold text-primary-600">$1</span>'
      );
      
      // Process emoji prefixed lines
      content = content.split('\n').map(line => {
        if (line.match(/^[📝🔍💡✨🎯🚀]/) && !line.includes('class="')) {
          return `<div class="flex items-start gap-2 my-1">
            <span class="text-lg leading-6">${line.charAt(0)}</span>
            <span class="flex-1">${line.slice(1).trim()}</span>
          </div>`;
        }
        return line;
      }).join('\n');

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
        <div className={`w-8 h-8 rounded-full ${colorScheme.avatarBg} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
          <i className="ri-customer-service-2-line text-sm"></i>
        </div>
      )}
      
      <div className={`relative chat-bubble-tail ${
        isUser 
          ? 'chat-bubble-user bg-gradient-to-br from-[#6A2C91]/10 to-[#6A2C91]/5 rounded-t-lg rounded-l-lg border border-[#6A2C91]/10' 
          : `chat-bubble-assistant ${colorScheme.messageBg} rounded-t-lg rounded-r-lg border ${colorScheme.messageBorder}`
        } p-4 shadow-sm`}>
        {!isUser && confidenceState.supportLevel === 'high-support' && (
          <div className={`text-xs ${colorScheme.supportTextColor} mb-2 italic`}>
            {supportivePhrase}
          </div>
        )}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-line">{formattedContent}</p>
        ) : (
          <p 
            className={`text-sm leading-relaxed ${colorScheme.messageTextStyle}`}
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
                    className={`p-1 h-auto ${colorScheme.keyPointsButtonColor} transition-colors flex items-center`}
                  >
                    <i className="ri-lightbulb-flash-line mr-1 text-amber-500"></i>
                    <span className="text-xs">Key Points</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className={colorScheme.titleColor}>💡 Key Points</DialogTitle>
                    <DialogDescription>
                      {confidenceState.emotionTone === 'anxious' 
                        ? 'Here are some helpful points to remember' 
                        : 'Important highlights from Asha\'s response'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-2">
                    {keyPoints.map((point: string, index: number) => (
                      <div key={index} className={`flex items-start gap-2 p-2 rounded-md ${colorScheme.keyPointBg}`}>
                        <div className={`w-5 h-5 ${colorScheme.keyPointNumberBg} rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5`}>
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
              className={`p-1 h-auto ${colorScheme.keyPointsButtonColor} transition-colors`}
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
