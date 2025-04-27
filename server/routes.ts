import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getChatCompletion, getCareerAdvice, getMentorshipInfo } from "./openai";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get chat messages
  app.get("/api/messages/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const messages = await storage.getMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // API endpoint to add a message and get AI response
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedBody = insertMessageSchema.safeParse(req.body);
      
      if (!validatedBody.success) {
        const validationError = fromZodError(validatedBody.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Store user message
      const userMessage = validatedBody.data;
      await storage.addMessage(userMessage);

      // Get all messages for this session to maintain context
      const sessionMessages = await storage.getMessages(userMessage.sessionId);
      
      // Format messages for OpenAI
      const formattedMessages = sessionMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response
      let aiResponse: string;
      
      const lowerCaseContent = userMessage.content.toLowerCase();
      if (lowerCaseContent.includes('career') || lowerCaseContent.includes('job')) {
        aiResponse = await getCareerAdvice(userMessage.content);
      } else if (lowerCaseContent.includes('mentor') || lowerCaseContent.includes('mentorship')) {
        aiResponse = await getMentorshipInfo(userMessage.content);
      } else {
        aiResponse = await getChatCompletion({ messages: formattedMessages });
      }

      // Store AI response
      const assistantMessage = await storage.addMessage({
        role: 'assistant',
        content: aiResponse,
        sessionId: userMessage.sessionId
      });

      // Return both messages
      res.json({
        userMessage,
        assistantMessage
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Error processing message" });
    }
  });

  // API endpoint to clear chat history
  app.delete("/api/messages/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      await storage.clearMessages(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ message: "Error clearing messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
