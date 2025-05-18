import { Groq } from "groq-sdk";
import { fetchRelevantData } from './rag';
import { performance } from 'perf_hooks';
import { Resource, Statistic } from './types';
import { detectLanguage, getLanguageSpecificError, type SupportedLanguage } from './utils/language';

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Track recent queries for repetition detection
const recentQueries = new Set<string>();
const MAX_RECENT_QUERIES = 100;
const QUERY_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

// Counter for consecutive failures
let consecutiveFailures = 0;

interface ChatCompletionRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  language?: string;
}

// Request metrics tracking
class RequestMetrics {
  private _startTime: number = 0;
  private _ragTime?: number;
  private _apiTime?: number;
  private _totalTime?: number;

  startRequest() {
    this._startTime = performance.now();
  }

  setRagTime(time: number) {
    this._ragTime = time;
  }

  setApiTime(time: number) {
    this._apiTime = time;
  }

  setTotalTime(time: number) {
    this._totalTime = time;
  }

  getMetrics() {
    return {
      startTime: this._startTime,
      ragTime: this._ragTime,
      apiTime: this._apiTime,
      totalTime: this._totalTime
    };
  }
}

// Track metrics for each request
const metrics = new RequestMetrics();

interface StructuredResponse {
  acknowledgment: string;
  guidance: string[];
  contextualData: Record<string, any> | null;
  followUp: string;
  style: {
    tone: 'supportive' | 'practical' | 'motivational';
    emoji: string;
    emphasis: 'emotional' | 'factual' | 'balanced';
  };
  resources: {
    relevance: number;
    suggestions: Array<{
      text: string;
      url: string;
      emoji: string;
      category: string;
      context: string;
    }>;
  };
}

// Add function to analyze emotional context
function analyzeEmotionalContext(message: string): {
  tone: 'supportive' | 'practical' | 'motivational';
  emphasis: 'emotional' | 'factual' | 'balanced';
} {
  const emotionalKeywords = ['feel', 'worried', 'anxious', 'stressed', 'overwhelmed', 'confused'];
  const practicalKeywords = ['how to', 'steps', 'process', 'guide', 'example', 'explain'];
  const motivationalKeywords = ['goal', 'achieve', 'improve', 'success', 'growth', 'better'];

  const lowercaseMessage = message.toLowerCase();
  
  const emotionalScore = emotionalKeywords.filter(word => lowercaseMessage.includes(word)).length;
  const practicalScore = practicalKeywords.filter(word => lowercaseMessage.includes(word)).length;
  const motivationalScore = motivationalKeywords.filter(word => lowercaseMessage.includes(word)).length;

  let tone: 'supportive' | 'practical' | 'motivational';
  if (emotionalScore > practicalScore && emotionalScore > motivationalScore) {
    tone = 'supportive';
  } else if (practicalScore > emotionalScore && practicalScore > motivationalScore) {
    tone = 'practical';
  } else {
    tone = 'motivational';
  }

  let emphasis: 'emotional' | 'factual' | 'balanced';
  if (emotionalScore > (practicalScore + motivationalScore) * 1.5) {
    emphasis = 'emotional';
  } else if ((practicalScore + motivationalScore) > emotionalScore * 1.5) {
    emphasis = 'factual';
  } else {
    emphasis = 'balanced';
  }

  return { tone, emphasis };
}

export async function getChatCompletion(request: ChatCompletionRequest): Promise<string> {
  metrics.startRequest();
  
  try {
    // Validate Groq API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY environment variable is not set");
      throw new Error("GROQ_API_KEY is required");
    }

    // Get the user's message and analyze emotional context
    const userMessage = request.messages[request.messages.length - 1].content;
    const emotionalContext = analyzeEmotionalContext(userMessage);
    
    // Check for repetitive queries
    if (recentQueries.has(userMessage)) {
      return "We've already covered that—would you like more details or a new topic?";
    }
    
    // Add to recent queries with cleanup
    recentQueries.add(userMessage);
    if (recentQueries.size > MAX_RECENT_QUERIES) {
      const iterator = recentQueries.values();
      const first = iterator.next();
      if (first.done !== true) {
        recentQueries.delete(first.value);
      }
    }
    
    // Set a timeout of 10 seconds for faster fallback
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API request timed out after 10 seconds"));
      }, 10000);
    });
    
    const ragStart = performance.now();
    // Determine language and fetch relevant data in parallel
    const [detectedLanguage, ragData] = await Promise.all([
      Promise.resolve(request.language || detectLanguage(userMessage)),
      fetchRelevantData(userMessage)
    ]);
    metrics.setRagTime(performance.now() - ragStart);

    // Create enhanced system message with RAG data
    let systemContent = `You are Asha AI, an empathetic, patient, and culturally inclusive career companion for women.  
– Always include the full 'messages' array (system + past turns) in each RAG call.  
– When needed, fetch live context from:  
    • BLS: https://api.bls.gov/publicAPI/v1/timeseries/data/{series_id}?startyear={YYYY}&endyear={YYYY}  
    • Women‑in‑Tech: https://women-in-tech.apievangelist.com/apis/people/  

CURRENT CONTEXT:
${ragData.statistics?.map(s => `- ${s.value} (Source: ${s.source})`).join('\n') || 'No current statistics available'}

RELEVANT RESOURCES:
${ragData.resources?.map(r => `- [${r.text}](${r.url})`).join('\n') || 'No specific resources available'}

RESPONSE GUIDELINES:
– Begin replies with a gentle opener ("Of course!", "Absolutely!") and acknowledge emotions briefly ("I understand this can be tough.").
– For compound queries, split responses into bullet points; highlight key terms with \`<mark>\`.
– Include clickable \`<a>\` hyperlinks only when directly relevant, and only once per resource.
– End with a caring follow‑up question: "Let me know how else I can support you."

IMPORTANT: Respond strictly in this JSON schema—no extra fields or text:
{
  "acknowledgment": "short empathetic sentence",
  "guidance": ["bullet‑point advice", "..."],
  "contextualData": null, // Only include stats/data when explicitly requested
  "followUp": "caring question to continue the conversation"
}`;

    // Add language instruction
    if (detectedLanguage !== 'english') {
      systemContent += `\n\nIMPORTANT: Respond in ${detectedLanguage} language. Ensure all text is in ${detectedLanguage}, not English.`;
    }

    const systemMessage = {
      role: "system" as const,
      content: systemContent,
    };
    
    // Convert message format to comply with Groq API requirements
    const formattedMessages = request.messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));
    
    console.log(`Sending ${formattedMessages.length} messages for context`);

    const apiStart = performance.now();
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [systemMessage, ...formattedMessages],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" }
    }).then(response => {
      metrics.setApiTime(performance.now() - apiStart);

      if (!response || !response.choices || !response.choices[0]) {
        console.error("Invalid response from Groq API:", response);
        throw new Error("Invalid response structure from Groq API");
      }

      // Reset consecutive failures on success
      consecutiveFailures = 0;
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("No content in Groq API response");
        return getLanguageSpecificError(detectedLanguage);
      }

      try {
        // Parse and format the response
        const structured = JSON.parse(content) as StructuredResponse;
        console.log("Successfully parsed Groq response");

        return `${structured.acknowledgment}\n\n${structured.guidance.map(point => `• ${point}`).join('\n')}${
          structured.contextualData ? '\n\n📊 Data:\n' + 
          Object.entries(structured.contextualData)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n') : ''
        }\n\n${structured.followUp}`;
      } catch (e) {
        console.error('Error parsing Groq response:', e);
        console.error('Raw content:', content);
        return content; // Fallback to raw content if parsing fails
      }
    });

    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    metrics.setTotalTime(performance.now() - metrics.getMetrics().startTime);

    // Log timing metrics
    const currentMetrics = metrics.getMetrics();
    console.log(`Performance metrics:
    - RAG time: ${Math.round(currentMetrics.ragTime || 0)}ms
    - API time: ${Math.round(currentMetrics.apiTime || 0)}ms
    - Total time: ${Math.round(currentMetrics.totalTime || 0)}ms`);

    // Log warning for high latency
    if (currentMetrics.totalTime && currentMetrics.totalTime > 500) {
      console.warn(`⚠️ High latency detected: ${Math.round(currentMetrics.totalTime)}ms`);
    }

    console.log("Successfully completed chat with Groq API");
    return response;
  } catch (error) {
    // Update consecutive failures
    consecutiveFailures++;

    // Enhanced error logging
    console.error("Error getting chat completion:");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", error);
    }
    
    // Handle errors with appropriate user messaging
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("GROQ_API_KEY")) {
        return "Authentication error with our AI service. Please contact support with error code: GROQ_AUTH_ERR";
      }
      
      if (error.message.includes("timed out")) {
        return "I'm having trouble fetching live data right now—would you like general guidance instead?";
      }
    }

    // After three consecutive failures, suggest escalation
    if (consecutiveFailures >= 3) {
      return "I apologize for the continued difficulties. If this persists, you can contact JobsForHer support for assistance.";
    }

    return "We're currently experiencing technical difficulties. Would you like general guidance while we resolve this issue?";
  }
}

export interface CareerConfidenceAnalysis {
  confidenceLevel: 'low' | 'medium' | 'high';
  emotionTone: 'negative' | 'neutral' | 'positive';
  supportLevel: 'high-support' | 'moderate-support' | 'light-support';
}

export async function analyzeCareerConfidence(text: string): Promise<CareerConfidenceAnalysis> {
  try {
    console.log("Starting career confidence analysis with Groq API");
    
    // Set a timeout of 5 seconds (shorter for sentiment analysis)
    const timeoutPromise = new Promise<CareerConfidenceAnalysis>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API confidence analysis request timed out after 5 seconds"));
      }, 5000);
    });
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: `You are an empathetic career counselor who specializes in understanding and supporting women's career journeys. You must respond in JSON format while maintaining deep emotional intelligence.

Your task is to carefully assess both the emotional state and career confidence in the text, considering:

EMOTIONAL INDICATORS:
- Expressed feelings and concerns
- Underlying anxieties or hopes
- Level of self-belief
- Past experiences' emotional impact
- Support system needs

CONFIDENCE ASSESSMENT AREAS:
1. Career confidence level (low/medium/high)
- Consider emotional language and self-expression
- Look for signs of self-advocacy or hesitation
- Assess goal clarity and commitment

2. Emotional tone (negative/neutral/positive)
- Evaluate both explicit and implicit emotions
- Consider cultural and personal context
- Look for signs of resilience or worry

3. Support level needed (high-support/moderate-support/light-support)
- Assess both emotional and practical support needs
- Consider expressed desire for guidance
- Evaluate current support systems

IMPORTANT: Respond with a valid JSON object that captures emotional nuance:
{
  "confidenceLevel": "low" | "medium" | "high",
  "emotionTone": "negative" | "neutral" | "positive",
  "supportLevel": "high-support" | "moderate-support" | "light-support",
  "reasoning": {
    "confidenceAnalysis": "empathetic analysis of confidence level",
    "emotionAnalysis": "caring assessment of emotional state",
    "supportAnalysis": "thoughtful support recommendation"
  }
}`,
        },
        {
          role: "user" as const,
          content: text,
        },
      ],
      max_tokens: 400,
      temperature: 0.3,
      response_format: { type: "json_object" }
    }).then(response => {
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in response");
      }
      
      try {
        const result = JSON.parse(content);
        console.log("Parsed confidence analysis:", result);
        
        return {
          confidenceLevel: result.confidenceLevel || 'medium',
          emotionTone: result.emotionTone || 'neutral',
          supportLevel: result.supportLevel || 'moderate-support'
        };
      } catch (parseError) {
        // Default values if parsing fails
        console.error("Error parsing confidence analysis response:", parseError);
        return {
          confidenceLevel: 'medium',
          emotionTone: 'neutral',
          supportLevel: 'moderate-support'
        };
      }
    });

    // Race between the API call and the timeout
    const result = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed career confidence analysis with Groq API", result);
    return result;
  } catch (error) {
    console.error("Error analyzing career confidence:", error);
    // Return default values if there's an error
    return {
      confidenceLevel: 'medium',
      emotionTone: 'neutral',
      supportLevel: 'moderate-support'
    };
  }
}
