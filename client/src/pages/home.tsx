import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import ChatHeader from "@/components/chat/chat-header";
import ChatContainer from "@/components/chat/chat-container";
import ChatInput from "@/components/chat/chat-input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  useCareerConfidence, 
  getColorSchemeForConfidence, 
  getSupportivePhrase 
} from "@/contexts/CareerConfidenceContext";
import { Message } from "@/types";

const Home = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const { toast } = useToast();
  const { confidenceState, updateConfidence } = useCareerConfidence();

  // Initialize session ID on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem("ashaSessionId");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = nanoid();
      localStorage.setItem("ashaSessionId", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Fetch messages for the current session with improved error handling and refetch logic
  const { data: messages = [], refetch } = useQuery<Message[]>({
    queryKey: ["/api/messages", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        console.log("No sessionId available, returning empty messages array");
        return [];
      }
      try {
        console.log(`Fetching messages for session: ${sessionId}`);
        const res = await fetch(`/api/messages/${sessionId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch messages: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log(`Retrieved ${data.length} messages for session ${sessionId}`);
        return data;
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
    },
    enabled: !!sessionId,
    // Increase refetch frequency to ensure UI updates
    refetchInterval: 2000,
    staleTime: 1000,
  });

  // Send message mutation with improved error handling and logging
  const { mutate: sendMessage } = useMutation({
    mutationFn: async (content: string) => {
      setIsLoading(true);
      try {
        const res = await apiRequest("POST", "/api/messages", {
          role: "user",
          content,
          sessionId,
        });
        
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Received response:", data);
        return data;
      } catch (error) {
        console.error("Error in sendMessage mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Message sent successfully, invalidating queries", data);
      
      // Update the career confidence state with the analysis from the API
      if (data.confidenceAnalysis) {
        console.log("Updating career confidence with analysis:", data.confidenceAnalysis);
        updateConfidence(data.confidenceAnalysis);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Error in sendMessage mutation:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  // Clear chat mutation
  const { mutate: clearChat } = useMutation({
    mutationFn: async () => {
      if (!sessionId) return;
      const res = await apiRequest("DELETE", `/api/messages/${sessionId}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      toast({
        title: "Success",
        description: "Chat history cleared.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear chat history.",
        variant: "destructive",
      });
    },
  });

  // Handles creating a new conversation
  const resetChat = () => {
    // Store current session ID before replacing it (if it exists)
    const currentSessionId = localStorage.getItem("ashaSessionId");
    if (currentSessionId) {
      const newKey = `prev_session_${nanoid(6)}`;
      localStorage.setItem(newKey, currentSessionId);
    }
    
    // Generate a new session ID and update local storage
    const newSessionId = nanoid();
    localStorage.setItem("ashaSessionId", newSessionId);
    setSessionId(newSessionId);
    
    toast({
      title: "Success",
      description: "Started a new conversation.",
    });
  };
  
  // Handles switching to a different conversation session
  const handleSelectSession = (newSessionId: string) => {
    if (newSessionId === sessionId) return; // Already on this session
    
    // Update local storage and state
    localStorage.setItem("ashaSessionId", newSessionId);
    setSessionId(newSessionId);
    
    toast({
      title: "Session Changed",
      description: "Switched to a different conversation.",
    });
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    // Log the message being sent 
    console.log(`Sending message with sessionId: ${sessionId}`);
    
    // Manually add the user message to state for immediate display
    // This creates a smoother UX by showing the user message immediately
    const tempMessage: Message = {
      id: Date.now(), // Temporary ID that will be replaced after refetch
      role: "user",
      content: content,
      timestamp: new Date().toISOString(),
      sessionId: sessionId
    };
    
    // Send the message to the API
    sendMessage(content);
    
    // Force an immediate refetch after a short delay to get the actual updated messages
    setTimeout(() => {
      refetch();
    }, 500);
  };

  // Get color scheme based on confidence level
  const colorScheme = getColorSchemeForConfidence(confidenceState);
  const supportivePhrase = getSupportivePhrase(confidenceState);
  const showSupportBanner = confidenceState.confidenceLevel === 'low' || 
                          (confidenceState.confidenceLevel === 'medium' && confidenceState.emotionTone === 'anxious');

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white shadow-lg">
      <ChatHeader 
        onReset={resetChat} 
        onSelectSession={handleSelectSession}
      />
      
      {showSupportBanner && (
        <div className={`py-2 px-4 text-sm ${
          confidenceState.confidenceLevel === 'low' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
        } flex items-center justify-center gap-2 border-b`}>
          <i className="ri-heart-pulse-line"></i>
          <span>{supportivePhrase}</span>
        </div>
      )}
      
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        isTtsEnabled={isTtsEnabled}
        onSendMessage={handleSendMessage}
      />
      <ChatInput 
        onSendMessage={handleSendMessage}
        onClearChat={clearChat}
        isTtsEnabled={isTtsEnabled}
        onToggleTts={() => setIsTtsEnabled(!isTtsEnabled)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Home;
