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
  getThemeColors 
} from "@/contexts/CareerConfidenceContext";

interface ChatMessageProps {
  message: Message;
  onSpeakMessage: (text: string) => void;
}

const URL_PATTERNS = {
  herkey: [
    { pattern: /herkey\.com\/jobs/i, type: 'job' },
    { pattern: /herkey\.com\/companies/i, type: 'company' },
    { pattern: /herkey\.com\/communities/i, type: 'community' },
    { pattern: /herkey\.com\/(sessions|learning)/i, type: 'learning' },
    { pattern: /herkey\.com\/view-post/i, type: 'article' },
    { pattern: /events\.herkey\.com/i, type: 'event' },
    { pattern: /blog\.herkey\.com/i, type: 'article' },
    { pattern: /jobsforherfoundation\.org/i, type: 'resource' }
  ],
  linkedin: [
    { pattern: /linkedin\.com\/jobs/i, type: 'job' },
    { pattern: /linkedin\.com\/company/i, type: 'company' },
    { pattern: /linkedin\.com\/learning/i, type: 'learning' }
  ],
  indeed: [
    { pattern: /indeed\.com\/jobs/i, type: 'job' },
    { pattern: /indeed\.com\/company/i, type: 'company' }
  ]
};

const ChatMessage = ({ message, onSpeakMessage }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [formattedContent, setFormattedContent] = useState<string>(message.content);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const { confidenceState, currentTheme } = useCareerConfidence();
  const themeColors = getThemeColors(currentTheme);

  // Function to analyze URL and get its metadata
  const getUrlMetadata = (url: string) => {
    // Check for HerKey URLs first (priority source)
    for (const { pattern, type } of URL_PATTERNS.herkey) {
      if (pattern.test(url)) {
        return {
          source: 'herkey',
          type,
          priority: 'high'
        };
      }
    }

    // Check other job sites
    for (const [source, patterns] of Object.entries(URL_PATTERNS)) {
      if (source === 'herkey') continue; // Already checked
      for (const { pattern, type } of patterns) {
        if (pattern.test(url)) {
          return {
            source,
            type,
            priority: 'normal'
          };
        }
      }
    }

    // Default for unrecognized URLs
    return {
      source: 'external',
      type: 'resource',
      priority: 'normal'
    };
  };

  // Process message content
  useEffect(() => {
    if (!isUser) {
      let content = message.content;

      // Format links with metadata
      content = content.replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, 
        (_, url, text) => {
          const { source, type, priority } = getUrlMetadata(url);
          
          return `<a 
            href="${url}" 
            class="bot-link" 
            data-source="${source}"
            data-type="${type}"
            data-priority="${priority}"
            target="_blank" 
            rel="noopener noreferrer"
          >${text}</a>`;
        }
      );

      // Handle numbered lists and bullet points
      const isListResponse = content.toLowerCase().includes('list of') || content.toLowerCase().includes('steps to');
      
      if (isListResponse) {
        content = content.split('\n').map(line => {
          // Number lists
          const numberMatch = line.match(/^\d+\./);
          if (numberMatch) {
            return `<div class="flex items-start gap-2 my-2">
              <span class="font-semibold min-w-[1.5rem] text-primary">${numberMatch[0]}</span>
              <span>${line.replace(/^\d+\.\s/, '')}</span>
            </div>`;
          }
          // Bullet points
          if (line.match(/^[•●◦○-]\s/)) {
            return `<div class="flex items-start gap-2 my-2">
              <span class="text-primary">•</span>
              <span>${line.replace(/^[•●◦○-]\s/, '')}</span>
            </div>`;
          }
          // Emoji bullets
          const emojiMatch = line.match(/^[\uD800-\uDBFF][\uDC00-\uDFFF]/);
          if (emojiMatch) {
            return `<div class="flex items-start gap-2 my-2">
              <span class="min-w-[1.5rem]">${emojiMatch[0]}</span>
              <span>${line.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/, '')}</span>
            </div>`;
          }
          return line;
        }).join('\n');
      } else {
        // For non-list responses, wrap paragraphs properly
        content = content.split('\n\n').map(para => {
          if (para.trim()) {
            return `<p class="mb-3">${para.trim()}</p>`;
          }
          return '';
        }).join('');
      }

      // Format bold text
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Format emphasis
      content = content.replace(/_(.*?)_/g, '<em>$1</em>');

      // Format code blocks
      content = content.replace(/```([^`]+)```/g, (_, code) => 
        `<pre class="bg-gray-50 p-3 rounded-md overflow-x-auto my-2"><code>${code.trim()}</code></pre>`
      );

      setFormattedContent(content);

      // Extract key points for the summary dialog
      const points = [];
      const boldMatches = content.match(/\*\*(.*?)\*\*/g) || [];
      const emojiPoints = content.split('\n').filter(line => 
        line.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/) && line.length > 5
      );
      const numberedPoints = content.match(/^\d+\.\s+([^\n]+)/gm) || [];

      // Combine all types of points and select the most relevant ones
      const allPoints = [...boldMatches.map(b => b.replace(/\*\*/g, '')), ...emojiPoints, ...numberedPoints]
        .map(p => p.trim())
        .filter(p => p.length > 5)
        .filter((p, i, arr) => arr.indexOf(p) === i) // Remove duplicates
        .slice(0, 5); // Limit to top 5 points

      setKeyPoints(allPoints);
    } else {
      setFormattedContent(message.content);
    }
  }, [message.content, isUser]);

  const getMessageStyle = () => {
    return {
      user: 'bg-primary-50 border-primary-100 text-gray-800',
      assistant: `${themeColors.messageBg} ${themeColors.messageBorder}`
    }[message.role] || '';
  };

  return (
    <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-full ${themeColors.avatarBg} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
          <i className="ri-customer-service-2-line text-sm"></i>
        </div>
      )}
      
      <div className={`relative p-4 rounded-lg shadow-sm ${getMessageStyle()}`}>
        {!isUser && confidenceState.confidenceLevel === 'low' && (
          <div className={`text-xs ${themeColors.supportTextColor} mb-2 italic`}>
            I'm here to support you every step of the way.
          </div>
        )}
        
        <div 
          className={`text-sm leading-relaxed ${themeColors.messageTextStyle}`}
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
        
        {!isUser && (
          <div className="mt-3 flex justify-end items-center gap-2">
            {keyPoints.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={`p-1 h-auto ${themeColors.keyPointsButtonColor}`}
                  >
                    <i className="ri-lightbulb-flash-line mr-1"></i>
                    Key Points
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className={themeColors.titleColor}>
                      💡 Key Takeaways
                    </DialogTitle>
                    <DialogDescription>
                      Important points from this response
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-3">
                    {keyPoints.map((point, index) => (
                      <div key={index} className={`flex items-start gap-2 p-3 rounded-md ${themeColors.keyPointBg}`}>
                        <span className={`${themeColors.keyPointNumberBg} w-6 h-6 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0`}>
                          {index + 1}
                        </span>
                        <p className="text-sm">{point}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button 
              variant="ghost"
              size="sm"
              className={`p-1 h-auto ${themeColors.keyPointsButtonColor}`}
              onClick={() => onSpeakMessage(message.content)}
            >
              <i className="ri-volume-up-line"></i>
            </Button>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white flex-shrink-0 shadow-md">
          <i className="ri-user-3-line text-sm"></i>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
