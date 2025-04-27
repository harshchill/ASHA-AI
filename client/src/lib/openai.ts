import { apiRequest } from "./queryClient";

interface ChatCompletionResponse {
  userMessage: {
    id: number;
    role: string;
    content: string;
    timestamp: string;
    sessionId: string;
  };
  assistantMessage: {
    id: number;
    role: string;
    content: string;
    timestamp: string;
    sessionId: string;
  };
}

export async function sendMessage(
  content: string,
  sessionId: string
): Promise<ChatCompletionResponse> {
  try {
    const response = await apiRequest("POST", "/api/messages", {
      role: "user",
      content,
      sessionId,
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}

export async function clearChat(sessionId: string): Promise<{ success: boolean }> {
  try {
    const response = await apiRequest("DELETE", `/api/messages/${sessionId}`);
    return await response.json();
  } catch (error) {
    console.error("Error clearing chat:", error);
    throw new Error("Failed to clear chat");
  }
}
