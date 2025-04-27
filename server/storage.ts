import { users, type User, type InsertUser, messages, type Message, type InsertMessage } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message related methods
  getMessages(sessionId: string): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  clearMessages(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<string, Message[]>;
  private userCurrentId: number;
  private messageCurrentId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.userCurrentId = 1;
    this.messageCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.messages.get(sessionId) || [];
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const timestamp = new Date();
    const message: Message = { ...insertMessage, id, timestamp };
    
    const sessionMessages = this.messages.get(insertMessage.sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(insertMessage.sessionId, sessionMessages);
    
    return message;
  }

  async clearMessages(sessionId: string): Promise<void> {
    this.messages.delete(sessionId);
  }
}

export const storage = new MemStorage();
