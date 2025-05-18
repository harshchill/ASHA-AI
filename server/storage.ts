import { users, type User, type InsertUser, messages, type Message, type InsertMessage } from "@shared/schema";

export interface SessionState {
  isFirstInteraction: boolean;
  lastInteraction: Date;
  messageCount: number;
}

export interface EnhancedMessage extends Message {
  isFirstInteraction: boolean;
}

// keep the interface the same
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message related methods
  getMessages(sessionId: string): Promise<EnhancedMessage[]>;
  addMessage(message: InsertMessage): Promise<EnhancedMessage>;
  clearMessages(sessionId: string): Promise<void>;
  
  // Session related methods
  getSessionState(sessionId: string): Promise<SessionState>;
  resetSession(sessionId: string): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private messages: EnhancedMessage[] = [];
  private sessions: Map<string, SessionState> = new Map();
  private userId = 1;
  private messageId = 1;
  private readonly MAX_HISTORY = 5;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = {
      id: this.userId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...insertUser
    };
    this.users.push(user);
    return user;
  }

  async getSessionState(sessionId: string): Promise<SessionState> {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        isFirstInteraction: true,
        lastInteraction: new Date(),
        messageCount: 0
      });
    }
    return this.sessions.get(sessionId)!;
  }

  async resetSession(sessionId: string): Promise<void> {
    this.sessions.set(sessionId, {
      isFirstInteraction: true,
      lastInteraction: new Date(),
      messageCount: 0
    });
    await this.clearMessages(sessionId);
  }

  async getMessages(sessionId: string): Promise<EnhancedMessage[]> {
    const sessionState = await this.getSessionState(sessionId);
    return this.messages
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.id - b.id)
      .slice(-this.MAX_HISTORY * 2); // Keep last 5 pairs (10 messages total)
  }

  async addMessage(insertMessage: InsertMessage): Promise<EnhancedMessage> {
    const sessionState = await this.getSessionState(insertMessage.sessionId);
    const message: EnhancedMessage = {
      id: this.messageId++,
      timestamp: new Date(),
      isFirstInteraction: sessionState.isFirstInteraction,
      ...insertMessage
    };
    
    this.messages.push(message);
    sessionState.messageCount++;
    sessionState.lastInteraction = new Date();
    
    // Update first interaction flag after first message
    if (sessionState.isFirstInteraction) {
      sessionState.isFirstInteraction = false;
    }
    
    return message;
  }

  async clearMessages(sessionId: string): Promise<void> {
    this.messages = this.messages.filter(message => message.sessionId !== sessionId);
    await this.resetSession(sessionId);
  }
}

// Export a MemStorage instance for use in the application
export const storage = new MemStorage();