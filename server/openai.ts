import { Groq } from "groq-sdk";
import { fetchRelevantData } from './rag';

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface ChatCompletionRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  language?: string; // Optional language parameter
}

// Supported languages
export type SupportedLanguage = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'bengali';

// Detect language from text using basic pattern recognition
// In a production app, this would use more sophisticated NLP
export function detectLanguage(text: string): SupportedLanguage {
  // Check for Hindi characters (Devanagari)
  if (/[\u0900-\u097F]/.test(text)) return 'hindi';
  
  // Check for Tamil characters
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil';
  
  // Check for Telugu characters
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu';
  
  // Check for Kannada characters
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kannada';
  
  // Check for Bengali characters
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali';
  
  // Default to English
  return 'english';
}

interface StructuredResponse {
  understanding: string;
  keyPoints: string[];
  statistics: Array<{ value: string; source: string }>;
  resources: Array<{ text: string; url: string }>;
  followUp: string;
}

export async function getChatCompletion(request: ChatCompletionRequest): Promise<string> {
  try {
    // Validate Groq API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY environment variable is not set");
      throw new Error("GROQ_API_KEY is required");
    }

    console.log("Starting chat completion with Groq API");
    
    // Set a timeout of 10 seconds for faster fallback
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API request timed out after 10 seconds"));
      }, 10000);
    });
    
    // Get the last message content safely
    const lastMessageContent = request.messages.length > 0 ? request.messages[request.messages.length - 1].content : '';
    
    // Determine language and fetch relevant data in parallel
    const [detectedLanguage, ragData] = await Promise.all([
      Promise.resolve(request.language || detectLanguage(lastMessageContent)),
      fetchRelevantData(lastMessageContent)
    ]);
    
    console.log(`Detected or specified language: ${detectedLanguage}`);
    console.log('RAG Data fetched:', JSON.stringify(ragData));
    
    // Create enhanced system message with RAG data
    let systemContent = `You are Asha AI, a deeply empathetic career companion for the JobsForHer platform. You must respond in JSON format while maintaining a warm, understanding, and supportive tone.

PERSONALITY TRAITS:
- Genuinely caring and emotionally attuned
- Patient and understanding listener
- Gently encouraging and supportive
- Culturally sensitive and inclusive
- Professional yet warm

EMOTIONAL ENGAGEMENT:
- Always acknowledge and validate feelings first
- Use phrases like "I understand how challenging this feels" or "It's natural to feel this way"
- Share relevant success stories to inspire hope
- Express genuine care in your responses
- Ask thoughtful follow-up questions about their emotions and aspirations

CURRENT CONTEXT:
${ragData.statistics?.map(s => `- ${s.value} (Source: ${s.source})`).join('\n') || 'No current statistics available'}

RELEVANT RESOURCES:
${ragData.resources?.map(r => `- [${r.text}](${r.url})`).join('\n') || 'No specific resources available'}

RESPONSE STRUCTURE:
1. Begin with emotional acknowledgment and warm greeting
2. Show understanding of both practical needs and emotional state
3. Provide supportive guidance with empathy
4. Share relevant success stories and statistics
5. Offer emotional support alongside practical resources
6. End with caring follow-up questions

EMPATHETIC LANGUAGE EXAMPLES:
- "I hear how challenging this situation is for you..."
- "Your feelings about this career transition are completely valid..."
- "Many women in our community have shared similar concerns..."
- "Let's explore this together with patience and understanding..."
- "You're showing great courage in taking this step..."

FORMATTING RULES:
- Use **bold** for key terms and emotional affirmations
- Include supportive emoji prefixes
- Balance practical advice with emotional support
- Cite statistics in an encouraging way
- Format resources as easily accessible links

IMPORTANT: Respond with a valid JSON object that combines warmth with structure:
{
  "understanding": "empathetic greeting and emotional acknowledgment",
  "keyPoints": ["array of supportive points with practical guidance"],
  "statistics": [{"value": "encouraging stat", "source": "source"}],
  "resources": [{"text": "supportive resource", "url": "url"}],
  "followUp": "caring follow-up question about their feelings and needs"
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
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [systemMessage, ...formattedMessages],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" }
    }).then(response => {
      if (!response || !response.choices || !response.choices[0]) {
        console.error("Invalid response from Groq API:", response);
        throw new Error("Invalid response structure from Groq API");
      }
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("No content in Groq API response");
        return getLanguageSpecificError(detectedLanguage as SupportedLanguage);
      }
      
      try {
        // Parse the JSON response
        const structured = JSON.parse(content) as StructuredResponse;
        console.log("Successfully parsed Groq response");
        
        // Format the response in a user-friendly way
        return `${structured.understanding}\n\n${structured.keyPoints.join('\n\n')}${
          structured.statistics.length ? '\n\n📊 Statistics:\n' + 
          structured.statistics.map((s: { value: string; source: string }) => 
            `- ${s.value} (${s.source})`).join('\n') : ''
        }${
          structured.resources.length ? '\n\n📚 Resources:\n' + 
          structured.resources.map((r: { text: string; url: string }) => 
            `- [${r.text}](${r.url})`).join('\n') : ''
        }\n\n${structured.followUp}`;
      } catch (e) {
        console.error('Error parsing Groq response:', e);
        console.error('Raw content:', content);
        return content; // Fallback to raw content if parsing fails
      }
    });
    
    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed chat with Groq API");
    return response;
  } catch (error) {
    // Enhanced error logging
    console.error("Error getting chat completion:");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", error);
    }
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Check if it's an API key error
    if (error instanceof Error && 
        (error.message.includes("API key") || error.message.includes("GROQ_API_KEY"))) {
      return "Authentication error with our AI service. Please contact support with error code: GROQ_AUTH_ERR";
    }
    
    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes("timed out")) {
      return "Our AI service is taking longer than expected to respond. Please try again in a moment.";
    }
    
    return "We're currently experiencing technical difficulties with our career assistant. Please try your request again in a few moments or contact JobsForHer support if the issue persists.";
  }
}

function getLanguageSpecificError(language: SupportedLanguage): string {
  const errors = {
    hindi: "मुझे खेद है, मैं इस समय आपके करियर से संबंधित प्रश्न को संसाधित नहीं कर सकती। कृपया थोड़ी देर बाद फिर से प्रयास करें।",
    tamil: "மன்னிக்கவும், நான் தற்போது உங்கள் வேலை தொடர்பான வினவலை செயலாக்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    telugu: "క్షమించండి, నేను ప్రస్తుతం మీ ఉద్యోగ సంబంధిత ప్రశ్నను ప్రాసెస్ చేయలేకపోతున్నాను. దయచేసి కొద్ది సేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
    kannada: "ಕ್ಷಮಿಸಿ, ನಾನು ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಉದ್ಯೋಗ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    bengali: "দুঃখিত, আমি এই মুহূর্তে আপনার কর্মসংক্রান্ত প্রশ্ন প্রক্রিয়া করতে পারছি না। দয়া করে কিছুক্ষণ পরে আবার চেষ্টা করুন।",
    english: "I'm sorry, I couldn't process your job-related query at the moment. Please try again shortly."
  };
  return errors[language] || errors.english;
}

export async function getCareerAdvice(query: string): Promise<string> {
  try {
    console.log("Starting career advice request with Groq API");
    
    // Set a timeout of 10 seconds
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API career advice request timed out after 10 seconds"));
      }, 10000);
    });
    
    // Detect language and fetch relevant data in parallel
    const [detectedLanguage, ragData] = await Promise.all([
      Promise.resolve(detectLanguage(query)),
      fetchRelevantData(query)
    ]);
    
    console.log(`Detected language for career advice: ${detectedLanguage}`);
    
    // Create enhanced system message with RAG data
    let systemContent = `You are Asha AI, a deeply empathetic career companion for the JobsForHer platform. You must respond in JSON format while maintaining a warm, understanding, and supportive tone.

PERSONALITY TRAITS:
- Genuinely caring and emotionally attuned
- Patient and understanding listener
- Gently encouraging and supportive
- Culturally sensitive and inclusive
- Professional yet warm

EMOTIONAL ENGAGEMENT:
- Always acknowledge and validate feelings first
- Use phrases like "I understand how challenging this feels" or "It's natural to feel this way"
- Share relevant success stories to inspire hope
- Express genuine care in your responses
- Ask thoughtful follow-up questions about their emotions and aspirations

CURRENT CONTEXT:
${ragData.statistics?.map(s => `- ${s.value} (Source: ${s.source})`).join('\n') || 'No current statistics available'}

RELEVANT RESOURCES:
${ragData.resources?.map(r => `- [${r.text}](${r.url})`).join('\n') || 'No specific resources available'}

RESPONSE STRUCTURE:
1. Begin with emotional acknowledgment and warm greeting
2. Show understanding of both practical needs and emotional state
3. Provide supportive guidance with empathy
4. Share relevant success stories and statistics
5. Offer emotional support alongside practical resources
6. End with caring follow-up questions

EMPATHETIC LANGUAGE EXAMPLES:
- "I hear how challenging this situation is for you..."
- "Your feelings about this career transition are completely valid..."
- "Many women in our community have shared similar concerns..."
- "Let's explore this together with patience and understanding..."
- "You're showing great courage in taking this step..."

FORMATTING RULES:
- Use **bold** for key terms and emotional affirmations
- Include supportive emoji prefixes
- Balance practical advice with emotional support
- Cite statistics in an encouraging way
- Format resources as easily accessible links

IMPORTANT: Respond with a valid JSON object that combines warmth with structure:
{
  "understanding": "empathetic greeting and emotional acknowledgment",
  "keyPoints": ["array of supportive points with practical guidance"],
  "statistics": [{"value": "encouraging stat", "source": "source"}],
  "resources": [{"text": "supportive resource", "url": "url"}],
  "followUp": "caring follow-up question about their feelings and needs"
}`;

    // Add language instruction
    if (detectedLanguage !== 'english') {
      systemContent += `\n\nIMPORTANT: Respond in ${detectedLanguage} language. Ensure all text is in ${detectedLanguage}, not English.`;
    }
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: systemContent,
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" }
    }).then(response => {
      const content = response.choices[0].message.content;
      if (!content) {
        return getLanguageSpecificError(detectedLanguage as SupportedLanguage);
      }
      
      try {
        // Parse the JSON response
        const structured = JSON.parse(content) as StructuredResponse;
        
        // Format the response in a user-friendly way
        return `${structured.understanding}\n\n${structured.keyPoints.join('\n\n')}${
          structured.statistics.length ? '\n\n📊 Statistics:\n' + 
          structured.statistics.map((s: { value: string; source: string }) => 
            `- ${s.value} (${s.source})`).join('\n') : ''
        }${
          structured.resources.length ? '\n\n📚 Resources:\n' + 
          structured.resources.map((r: { text: string; url: string }) => 
            `- [${r.text}](${r.url})`).join('\n') : ''
        }\n\n${structured.followUp}`;
      } catch (e) {
        console.error('Error parsing structured response:', e);
        return content; // Fallback to raw content if parsing fails
      }
    });
    
    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed career advice with Groq API");
    return response;
  } catch (error) {
    // Enhanced error logging
    console.error("Error getting career advice:");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", error);
    }
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Check if it's an API key error
    if (error instanceof Error && 
        (error.message.includes("API key") || error.message.includes("GROQ_API_KEY"))) {
      return "Authentication error with our AI service. Please contact support with error code: GROQ_AUTH_ERR";
    }
    
    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes("timed out")) {
      return "Our AI service is taking longer than expected to respond. Please try again in a moment.";
    }
    
    return "We apologize, but our career advisory service is temporarily unavailable. Please try your query again shortly.";
  }
}

export async function getMentorshipInfo(query: string): Promise<string> {
  try {
    console.log("Starting mentorship info request with Groq API");
    
    // Set a timeout of 10 seconds
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API mentorship info request timed out after 10 seconds"));
      }, 10000);
    });
    
    // Detect language and fetch relevant data in parallel
    const [detectedLanguage, ragData] = await Promise.all([
      Promise.resolve(detectLanguage(query)),
      fetchRelevantData(query)
    ]);
    
    console.log(`Detected language for mentorship info: ${detectedLanguage}`);
    
    // Create enhanced system message with RAG data
    let systemContent = `You are Asha AI, a mentorship specialist for the JobsForHer platform focused on connecting women with career mentors.

CURRENT CONTEXT:
${ragData.statistics?.map(s => `- ${s.value} (Source: ${s.source})`).join('\n') || 'No current statistics available'}

RELEVANT RESOURCES:
${ragData.resources?.map(r => `- [${r.text}](${r.url})`).join('\n') || 'No specific resources available'}

RESPONSE FORMAT:
1. Start with an empathetic understanding of the mentorship needs
2. Provide specific guidance about mentorship opportunities
3. Include success statistics from mentor-mentee relationships
4. Reference specific mentors or mentorship programs
5. End with clear next steps for connecting with mentors

FORMATTING RULES:
- Use **bold** for key mentorship areas and roles
- Include emoji prefixes for better readability
- Keep advice practical and immediately actionable
- Cite sources for any statistics or success stories
- Format URLs as proper markdown links

CONSTRAINTS:
- Focus on women's professional mentorship
- Be culturally sensitive and encouraging
- Emphasize both giving and receiving mentorship
- Limit to 5-7 main points
- Include specific JobsForHer mentorship programs

OUTPUT FORMAT:
{
  "understanding": "string",
  "keyPoints": ["string"],
  "statistics": [{"value": "string", "source": "string"}],
  "resources": [{"text": "string", "url": "string"}],
  "followUp": "string"
}`;

    // Add language instruction
    if (detectedLanguage !== 'english') {
      systemContent += `\n\nIMPORTANT: Respond in ${detectedLanguage} language. Ensure all text is in ${detectedLanguage}, not English.`;
    }
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: systemContent,
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" }
    }).then(response => {
      const content = response.choices[0].message.content;
      if (!content) {
        return getLanguageSpecificError(detectedLanguage as SupportedLanguage);
      }
      
      try {
        // Parse the JSON response
        const structured = JSON.parse(content) as StructuredResponse;
        
        // Format the response in a user-friendly way
        return `${structured.understanding}\n\n${structured.keyPoints.join('\n\n')}${
          structured.statistics.length ? '\n\n📊 Statistics:\n' + 
          structured.statistics.map((s: { value: string; source: string }) => 
            `- ${s.value} (${s.source})`).join('\n') : ''
        }${
          structured.resources.length ? '\n\n📚 Resources:\n' + 
          structured.resources.map((r: { text: string; url: string }) => 
            `- [${r.text}](${r.url})`).join('\n') : ''
        }\n\n${structured.followUp}`;
      } catch (e) {
        console.error('Error parsing structured response:', e);
        return content; // Fallback to raw content if parsing fails
      }
    });
    
    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed mentorship info with Groq API");
    return response;
  } catch (error) {
    // Enhanced error logging
    console.error("Error getting mentorship info:");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", error);
    }
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Check if it's an API key error
    if (error instanceof Error && 
        (error.message.includes("API key") || error.message.includes("GROQ_API_KEY"))) {
      return "Authentication error with our AI service. Please contact support with error code: GROQ_AUTH_ERR";
    }
    
    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes("timed out")) {
      return "Our AI service is taking longer than expected to respond. Please try again in a moment.";
    }
    
    return "We regret to inform you that our mentorship information service is temporarily unavailable. Please try your request again shortly.";
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