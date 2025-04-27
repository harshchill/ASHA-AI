import { users, type User, type InsertUser, messages, type Message, type InsertMessage } from "@shared/schema";

// keep the interface the same
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message related methods
  getMessages(sessionId: string): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  clearMessages(sessionId: string): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private messages: Message[] = [];
  private userId = 1;
  private messageId = 1;

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

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.messages
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.id - b.id);
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const message = {
      id: this.messageId++,
      timestamp: new Date(),
      ...insertMessage
    };
    this.messages.push(message);
    return message;
  }

  async clearMessages(sessionId: string): Promise<void> {
    this.messages = this.messages.filter(message => message.sessionId !== sessionId);
  }
}

// Export a MemStorage instance for use in the application
export const storage = new MemStorage();