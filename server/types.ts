interface ResourceMetrics {
  relevance: number;
  emotionalContext?: 'supportive' | 'practical' | 'motivational';
  usageCount: number;
  lastUsed?: number;
}

export interface Resource {
  text: string;
  url: string;
  emoji?: string;
  category?: 'course' | 'community' | 'tool' | 'career' | 'mentorship';
  level?: 'beginner' | 'intermediate' | 'advanced';
  metrics?: ResourceMetrics;
}

export interface Statistic {
  value: string;
  source: string;
  emoji?: string;
  category?: 'success' | 'trend' | 'impact' | 'learning';
  metrics?: ResourceMetrics;
}

export interface RAGData {
  statistics: Statistic[];
  resources: Resource[];
  metrics?: {
    requestTime: number;
    responseSize: number;
    latencyWarning?: boolean;
    relevanceMetrics?: {
      topResourceScore: number;
      contextMatch: number;
      emotionalAlignment: number;
    };
  };
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
