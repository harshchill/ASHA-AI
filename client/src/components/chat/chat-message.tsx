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
    
    // Extract bold text and highlights
    const boldMatches = content.match(/(?:\*\*|<span class="bot-highlight">)(.*?)(?:\*\*|<\/span>)/g);
    if (boldMatches) {
      boldMatches.forEach(match => {
        const cleanPoint = match.replace(/(\*\*|<span class="bot-highlight">|<\/span>)/g, '').trim();
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
    
    // Extract emoji-led points using a more reliable method
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      // Check if line starts with an emoji (surrogate pair)
      if (trimmedLine.match(/^[\uD800-\uDBFF][\uDC00-\uDFFF]/)) {
        if (!points.includes(trimmedLine) && trimmedLine.length > 5) {
          points.push(trimmedLine);
        }
      }
    });
    
    return points.slice(0, 5); // Limit to top 5 key points
  };
  
  // Process message content to highlight important points
  useEffect(() => {
    if (!isUser) {
      let content = message.content;
      
      // Format link tags with our custom bot-link class and improved styling
      content = content.replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, 
        '<a href="$1" class="bot-link inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200" target="_blank" rel="noopener noreferrer">$2</a>'
      );
      
      // Format JSON blocks with syntax highlighting
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
      
      // Format code blocks with syntax highlighting
      if (content.includes('```jsx') || content.includes('```tsx')) {
        content = content.replace(/```(jsx|tsx)([\s\S]*?)```/g, 
          '<pre class="bg-gray-50 p-3 rounded-md overflow-x-auto"><code class="language-typescript">$2</code></pre>'
        );
      }
      
      // Convert markdown bold to highlighted spans
      content = content.replace(/\*\*(.*?)\*\*/g, '<span class="bot-highlight">$1</span>');
      
      // Process bullet points and emoji-prefixed lines with improved styling
      content = content.split('\n').map(line => {
        const trimmedLine = line.trim();
        // Only match lines starting with "•" bullet point
        if (trimmedLine.startsWith('•')) {
          const restOfLine = trimmedLine.slice(1).trim();
          return `<div class="flex items-start gap-3 my-2.5 -ml-1 group first:mt-0">
            <span class="text-xl leading-6 opacity-90 transition-transform duration-200 group-hover:scale-110 min-w-[1.5rem] text-center">•</span>
            <span class="flex-1 leading-relaxed">${restOfLine}</span>
          </div>`;
        }
        return line;
      }).join('\n');

      setFormattedContent(content);
      setKeyPoints(extractKeyPoints(message.content));
    } else {
      setFormattedContent(message.content);
    }
  }, [message.content, isUser]);

  return (
    <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'self-end' : 'self-start'} mb-4`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-full ${colorScheme.avatarBg} flex items-center justify-center text-white flex-shrink-0 shadow-md animate-fadeIn`}>
          <i className="ri-customer-service-2-line text-sm"></i>
        </div>
      )}
      
      <div className={`relative chat-bubble-tail ${
        isUser 
          ? 'chat-bubble-user bg-gradient-to-br from-[#6A2C91]/10 to-[#6A2C91]/5 rounded-t-lg rounded-l-lg border border-[#6A2C91]/10' 
          : `chat-bubble-assistant ${colorScheme.messageBg} rounded-t-lg rounded-r-lg border ${colorScheme.messageBorder}`
        } p-4 shadow-sm transition-all duration-200 hover:shadow-md animate-fadeIn`}>
        {!isUser && confidenceState.supportLevel === 'high-support' && (
          <div className={`text-xs ${colorScheme.supportTextColor} mb-2.5 italic animate-fadeIn`}>
            {supportivePhrase}
          </div>
        )}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-line">{formattedContent}</p>
        ) : (
          <p 
            className={`text-sm leading-relaxed ${colorScheme.messageTextStyle} [&_a]:transition-colors [&_pre]:my-2`}
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        )}
        
        {!isUser && (
          <div className="text-xs text-right text-neutral-700/50 mt-4 flex justify-end items-center gap-2">
            {keyPoints.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`p-1.5 h-auto ${colorScheme.keyPointsButtonColor} transition-all duration-200 flex items-center hover:bg-opacity-10 group`}
                  >
                    <i className="ri-lightbulb-flash-line mr-1.5 text-amber-500 transition-transform duration-200 group-hover:scale-110"></i>
                    <span className="text-xs font-medium">Key Points</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className={`${colorScheme.titleColor} flex items-center gap-2`}>
                      <span className="animate-pulse">💡</span> Key Points
                    </DialogTitle>
                    <DialogDescription>
                      {confidenceState.emotionTone === 'anxious' 
                        ? 'Here are some helpful points to remember' 
                        : 'Important highlights from Asha\'s response'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-2.5">
                    {keyPoints.map((point: string, index: number) => (
                      <div key={index} 
                        className={`flex items-start gap-3 p-3 rounded-md ${colorScheme.keyPointBg} transition-all duration-200 hover:brightness-[0.98] group`}
                      >
                        <div className={`w-6 h-6 ${colorScheme.keyPointNumberBg} rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5 text-xs font-medium transition-transform duration-200 group-hover:scale-110`}>
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-1.5 h-auto ${colorScheme.keyPointsButtonColor} transition-all duration-200 hover:bg-opacity-10`}
              onClick={() => onSpeakMessage(message.content)}
              title="Listen to response"
            >
              <i className="ri-volume-up-line text-lg"></i>
            </Button>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FF8000] flex items-center justify-center text-white flex-shrink-0 shadow-md animate-fadeIn">
          <i className="ri-user-3-line text-sm"></i>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
