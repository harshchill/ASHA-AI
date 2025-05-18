import { Groq } from 'groq-sdk';
import { retrieveRelevantDocs } from './rag-service';
import { detectLanguage } from '../utils/language';
import type { EnhancedMessage } from '../storage';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface RetrievalDoc {
  content: string;
  source: string;
  score: number;
  title?: string;
  url?: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function formatRetrievalDocs(docs: RetrievalDoc[]): string {
  if (docs.length === 0) return '';
  
  return docs.map(doc => {
    const source = doc.url ? `<a href="${doc.url}" class="bot-link">${doc.title || doc.source}</a>` : doc.source;
    return `Source: ${source}\nContent: ${doc.content}\nRelevance: ${(doc.score * 100).toFixed(1)}%`;
  }).join('\n\n');
}

function getFallbackResponse(error: any, isFirstInteraction: boolean): string {
  const fallbacks = [
    "🌟 I'm having trouble retrieving that specific information right now. Would you like some general career tips instead?",
    "💫 I can't access that data at the moment. How about we explore some alternative career resources?",
    "✨ Let me suggest some other helpful resources for your career journey.",
    "💖 I'd be happy to share some general career guidance while we wait for that specific information."
  ];
  
  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return isFirstInteraction 
    ? "🌟 Hello! I'm Asha AI 😊 I'm having trouble accessing some information right now, but I'd love to help you with general career guidance. What would you like to know? 💖"
    : randomFallback;
}

export async function generateResponse(
  userMessage: string,
  sessionHistory: EnhancedMessage[],
  retrievalDocs: RetrievalDoc[] = []
) {
  try {
    const detectedLanguage = detectLanguage(userMessage);
    const isFirstInteraction = sessionHistory.length === 0 || sessionHistory[0].isFirstInteraction;
    
    // Check if this is a fact-based query
    const factBasedKeywords = [
      'statistics', 'data', 'report', 'research', 'numbers', 'study', 'survey',
      'percentage', 'rate', 'trend', 'analysis', 'findings', 'results', 'survey',
      'how many', 'what is the', 'tell me about', 'show me', 'find', 'search'
    ];
    const isFactBased = factBasedKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    
    // Fetch relevant documents if it's a fact-based query
    if (isFactBased && retrievalDocs.length === 0) {
      retrievalDocs = await retrieveRelevantDocs(userMessage);
    }

    // Construct system message
    let systemContent = `You are Asha AI, an enthusiastic and supportive career companion for women. 

RESPONSE FORMAT:
1. ${isFirstInteraction 
    ? 'Start with: "🌟 Hello! I\'m Asha AI 😊 How can I empower you today? 💖"'
    : 'Start with a brief acknowledgment like "Sure!", "Got it!", or "I understand!"'}
2. Format your response in clear, concise bullet points
3. Use appropriate emojis naturally throughout
4. End with "Let me know if I can support you further! 💕"

IMPORTANT GUIDELINES:
- Maintain a warm, empathetic tone throughout
- Format all URLs as <a href="URL" class="bot-link">descriptive text</a>
- For any statistics or facts, cite the source: "According to [Source Name], ..."
- If unsure about information, say: "I'm sorry, I don't have reliable info on that right now."
- Keep responses concise and actionable
- Reference previous conversation context naturally
- Use bullet points for multi-item responses
- Never use long paragraphs
- Wrap key terms in <span class="bot-highlight">...</span>

${retrievalDocs.length > 0 ? 'Here is relevant contextual data:\n' + formatRetrievalDocs(retrievalDocs) : ''}`;

    // Add language instruction if not English
    if (detectedLanguage !== 'english') {
      systemContent += `\n\nIMPORTANT: Respond in ${detectedLanguage} language. All text should be in ${detectedLanguage}, not English.`;
    }

    // Format history for context (last 5 messages)
    const recentHistory = sessionHistory.slice(-5);
    const messages = [
      { role: 'system' as const, content: systemContent },
      ...recentHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: userMessage }
    ];

    // Call Groq API with timeout
    const response = await Promise.race([
      groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages,
        max_tokens: 800,
        temperature: 0.7
      }) as Promise<GroqResponse>,
      new Promise<GroqResponse>((_, reject) => setTimeout(() => reject(new Error('API timeout')), 10000))
    ]);

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response');
    }

    return response.choices[0].message.content;

  } catch (error) {
    console.error('Error generating response:', error);
    return getFallbackResponse(error, sessionHistory.length === 0);
  }
}
