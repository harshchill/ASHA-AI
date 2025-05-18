import { Groq } from 'groq-sdk';
import { retrieveRelevantDocs } from './rag-service';
import { detectLanguage } from '../utils/language';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface SessionHistory {
  role: 'user' | 'assistant';
  content: string;
}

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
    const source = doc.url ? `<a href="${doc.url}">${doc.title || doc.source}</a>` : doc.source;
    return `Source: ${source}\nContent: ${doc.content}\nRelevance: ${(doc.score * 100).toFixed(1)}%`;
  }).join('\n\n');
}

export async function generateResponse(
  userMessage: string,
  sessionHistory: SessionHistory[],
  retrievalDocs: RetrievalDoc[] = []
) {
  try {
    const detectedLanguage = detectLanguage(userMessage);
    
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
    let systemContent = `You are Asha AI, an empathetic and enthusiastic career companion exclusively for women. 🎉 

Your responses must:
1. Start with a bright, loving greeting like "🌟 Hello! I'm Asha AI 😊 How can I empower you today? 💖"
2. Be warm, excited, encouraging, and tailored to women
3. Include appropriate emojis woven naturally into the response
4. Use accurate data, quoting sources when available
5. Format any URLs as clickable HTML <a> tags with descriptive text
6. End with "Let me know if I can support you further! 💕"

IMPORTANT GUIDELINES:
- If you're unsure about any information, say "I'm sorry, I don't have reliable info on that right now."
- Always maintain a supportive and empowering tone
- Use emojis naturally to convey warmth and enthusiasm
- Keep responses concise but informative
- Focus on actionable advice and practical solutions
- Reference previous conversation context when relevant

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
    return `🌟 I apologize, but I'm having trouble processing your request right now. Please try again in a moment! 💝`;
  }
}
