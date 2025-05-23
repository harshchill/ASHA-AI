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

interface ChatMessageProps {
  message: Message;
  onSpeakMessage: (text: string) => void;
}

interface StructuredResponse {
  acknowledgment: string;
  guidance: string[];
  contextualData: Record<string, any> | null;
  followUp: string;
  style: {
    tone: 'supportive' | 'practical' | 'motivational';
    emoji: string;
    emphasis: 'emotional' | 'factual' | 'balanced';
  };
  resources: {
    relevance: number;
    suggestions: Array<{
      text: string;
      url: string;
      emoji: string;
      category: string;
      context: string;
    }>;
  };
}

const ChatMessage = ({ message, onSpeakMessage }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [formattedContent, setFormattedContent] = useState<string>(message.content);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [showKeyPoints, setShowKeyPoints] = useState<boolean>(false);
  const [structuredResponse, setStructuredResponse] = useState<StructuredResponse | null>(null);
  const { confidenceState } = useCareerConfidence();
  
  // Get the color scheme and supportive text based on confidence level
  const colorScheme = getColorSchemeForConfidence(confidenceState);
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

  // Process message content to parse structured responses
  useEffect(() => {
    if (!isUser) {
      try {
        const parsedResponse = JSON.parse(message.content) as StructuredResponse;
        setStructuredResponse(parsedResponse);
        
        // Format the content with styling
        let formattedText = `<div class="space-y-4">
          <div class="text-${parsedResponse.style.tone} font-medium">
            ${parsedResponse.style.emoji} ${parsedResponse.acknowledgment}
          </div>
          <div class="space-y-2">
            ${parsedResponse.guidance.map(point => `
              <div class="flex items-start gap-2 text-${parsedResponse.style.emphasis}">
                <span class="text-accent">•</span>
                <span>${point}</span>
              </div>
            `).join('')}
          </div>
          ${parsedResponse.contextualData ? `
            <div class="mt-4 p-4 bg-muted rounded-lg">
              <h4 class="font-semibold mb-2">📊 Relevant Data</h4>
              ${Object.entries(parsedResponse.contextualData).map(([key, value]) => `
                <div class="flex items-center gap-2">
                  <span class="font-medium">${key}:</span>
                  <span>${value}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${parsedResponse.resources.suggestions.length > 0 ? `
            <div class="mt-4">
              <h4 class="font-semibold mb-2">🔍 Helpful Resources</h4>
              ${parsedResponse.resources.suggestions.map(resource => `
                <a href="${resource.url}" 
                   class="flex items-center gap-2 p-2 hover:bg-accent/10 rounded-lg text-accent hover:underline"
                   target="_blank" 
                   rel="noopener noreferrer">
                  <span>${resource.emoji}</span>
                  <span>${resource.text}</span>
                </a>
              `).join('')}
            </div>
          ` : ''}
          <div class="mt-4 text-muted-foreground">
            ${parsedResponse.followUp}
          </div>
        </div>`;
        
        setFormattedContent(formattedText);
        setKeyPoints(extractKeyPoints(message.content));
      } catch (e) {
        // If parsing fails, fall back to the existing formatting logic
        let content = message.content;
        
        // Highlight bold text (already in markdown format)
        content = content.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-[#6A2C91]">$1</span>');
        
        // Highlight numbered points (1., 2., etc.)
        content = content.replace(/(\d+\.\s+)([^\n]+)/g, '$1<span class="font-semibold text-[#6A2C91]">$2</span>');
        
        // Highlight bullet points
        content = content.replace(/(\*\s+)([^\n]+)/g, '$1<span class="font-semibold">$2</span>');
        
        setFormattedContent(content);
        setKeyPoints(extractKeyPoints(content));
      }
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
                    {keyPoints.map((point, index) => (
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
