import { users, type User, type InsertUser, messages, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

// rewrite MemStorage to DatabaseStorage
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.sessionId, sessionId));
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async clearMessages(sessionId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.sessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();
