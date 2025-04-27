import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Message } from "@/types";

interface ConversationHistoryProps {
  onSelectSession: (sessionId: string) => void;
}

interface Session {
  id: string;
  preview: string;
  timestamp: Date;
}

const ConversationHistory = ({ onSelectSession }: ConversationHistoryProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load session IDs from local storage
  useEffect(() => {
    try {
      // Scan local storage for session IDs
      const storedSessions: Session[] = [];
      // Current session
      const currentSessionId = localStorage.getItem("ashaSessionId");
      
      if (currentSessionId) {
        storedSessions.push({
          id: currentSessionId,
          preview: "Current conversation",
          timestamp: new Date()
        });
      }

      // Use the Web Storage API to iterate through localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Look for items that could be previous session IDs (excluding current one)
        if (key && key.startsWith("prev_session_") && localStorage.getItem(key)) {
          const sessionId = localStorage.getItem(key);
          if (sessionId && sessionId !== currentSessionId) {
            storedSessions.push({
              id: sessionId,
              preview: `Conversation ${i}`,
              timestamp: new Date(Date.now() - (i * 86400000)) // Mock timestamp, 1 day apart
            });
          }
        }
      }
      
      // Sort sessions by timestamp (newest first)
      setSessions(storedSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  }, [isOpen]);

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-2 text-neutral-700/70 hover:bg-neutral-200/30 rounded-full transition-colors"
              >
                <i className="ri-history-line text-lg"></i>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>📚 View Conversation History</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>📚 Conversation History</DialogTitle>
          <DialogDescription>
            View and switch between your previous conversations with Asha AI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[50vh] overflow-y-auto pr-2 my-4">
          {sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 cursor-pointer border border-gray-200"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex flex-col">
                    <div className="font-medium text-sm text-neutral-800 flex items-center">
                      {session.preview}
                      {session === sessions[0] && (
                        <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-800 hover:bg-purple-200">
                          Current
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(session.timestamp)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-neutral-600"
                  >
                    <i className="ri-arrow-right-line"></i>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No previous conversations found</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => {
              // Store the current session ID
              const currentSessionId = localStorage.getItem("ashaSessionId");
              if (currentSessionId) {
                const newKey = `prev_session_${nanoid(6)}`;
                localStorage.setItem(newKey, currentSessionId);
              }
              
              // Create a new session
              const newSessionId = nanoid();
              localStorage.setItem("ashaSessionId", newSessionId);
              onSelectSession(newSessionId);
              setIsOpen(false);
            }}
          >
            <i className="ri-add-line mr-1"></i>
            New Conversation
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationHistory;