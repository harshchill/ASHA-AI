export interface RAGData {
  statistics?: Array<{
    value: string;
    source: string;
  }>;
  resources?: Array<{
    text: string;
    url: string;
  }>;
}

export interface Message {
  id: number;
  role: string;
  content: string;
  sessionId: string;
  timestamp: Date;
}

export interface InsertMessage {
  role: string;
  content: string;
  sessionId: string;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser {
  username: string;
  displayName: string;
}
