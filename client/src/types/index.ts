export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string | Date;
  sessionId: string;
}