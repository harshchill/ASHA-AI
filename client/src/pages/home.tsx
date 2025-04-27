import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import ChatHeader from "@/components/chat/chat-header";
import ChatContainer from "@/components/chat/chat-container";
import ChatInput from "@/components/chat/chat-input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string | Date;
  sessionId: string;
}

const Home = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const { toast } = useToast();

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

  // Fetch messages for the current session
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await fetch(`/api/messages/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!sessionId,
  });

  // Send message mutation
  const { mutate: sendMessage } = useMutation({
    mutationFn: async (content: string) => {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/messages", {
        role: "user",
        content,
        sessionId,
      });
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      setIsLoading(false);
    },
    onError: (error) => {
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

  const resetChat = () => {
    // Generate a new session ID and clear local storage
    const newSessionId = nanoid();
    localStorage.setItem("ashaSessionId", newSessionId);
    setSessionId(newSessionId);
    toast({
      title: "Success",
      description: "Started a new conversation.",
    });
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    sendMessage(content);
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white shadow-lg">
      <ChatHeader onReset={resetChat} />
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        isTtsEnabled={isTtsEnabled}
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
