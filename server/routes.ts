import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeCareerConfidence, type CareerConfidenceAnalysis } from "./openai";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateResponse } from './services/prompt-service';
import { chatHandler } from './controllers/chatController.js';
import { retryMiddleware } from './middleware/retryMiddleware.js';

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
      console.log("Received new message request");
      
      // Validate request body
      const validatedBody = insertMessageSchema.safeParse(req.body);
      
      if (!validatedBody.success) {
        const validationError = fromZodError(validatedBody.error);
        console.error("Validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }

      // Store user message
      const userMessage = validatedBody.data;
      console.log(`Processing message from session ${userMessage.sessionId}`);
      await storage.addMessage(userMessage);

      // Get all messages for this session to maintain context
      const sessionMessages = await storage.getMessages(userMessage.sessionId);
      console.log(`Retrieved ${sessionMessages.length} messages for context`);
      
      // Generate AI response using centralized prompt service
      const aiResponse = await generateResponse(
        userMessage.content,
        sessionMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      );

      console.log("Successfully received AI response");
      
      // Store AI response
      const assistantMessage = await storage.addMessage({
        role: 'assistant',
        content: aiResponse,
        sessionId: userMessage.sessionId
      });

      console.log("Stored assistant message in database");

      // Analyze the career confidence level from the user message
      console.log("Analyzing career confidence from user message");
      let confidenceAnalysis: CareerConfidenceAnalysis;
      try {
        confidenceAnalysis = await analyzeCareerConfidence(userMessage.content);
        console.log("Career confidence analysis:", confidenceAnalysis);
      } catch (error) {
        console.error("Error analyzing career confidence:", error);
        // Default values if analysis fails
        confidenceAnalysis = {
          confidenceLevel: 'medium',
          emotionTone: 'neutral',
          supportLevel: 'moderate-support'
        };
      }

      // Return messages with confidence analysis
      res.json({
        userMessage,
        assistantMessage,
        confidenceAnalysis
      });
      
      console.log("Successfully completed message processing");
    } catch (error) {
      console.error("Error processing message:", error);
      console.error("Error details:", error instanceof Error ? error.stack : JSON.stringify(error));
      res.status(500).json({ 
        message: "Error processing message", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
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

  // Add POST /chat route with retry middleware
  app.post('/chat', retryMiddleware(chatHandler));

  const httpServer = createServer(app);
  return httpServer;
}
