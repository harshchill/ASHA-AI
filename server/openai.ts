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
    
    // Create enhanced system message with RAG data
    let systemContent = `You are Asha AI, a specialized job assistant for the JobsForHer platform.

CURRENT CONTEXT:
${ragData.statistics?.map(s => `- ${s.value} (Source: ${s.source})`).join('\n') || 'No current statistics available'}

RELEVANT RESOURCES:
${ragData.resources?.map(r => `- [${r.text}](${r.url})`).join('\n') || 'No specific resources available'}

RESPONSE FORMAT:
1. Always start with a polite greeting in the user's language
2. Present information in clear, distinct sections:
   - Understanding: Brief restatement of the user's needs
   - Response: Key points using emojis as prefixes
   - Follow-up: Gentle prompt for more specific questions

FORMATTING RULES:
- Use **bold** for key terms and important phrases
- Structure responses as clear bullet points
- Keep points concise and actionable
- Include relevant statistics when available
- Add clickable links to JobsForHer resources

CONSTRAINTS:
- Focus solely on women's professional development
- Maintain cultural sensitivity
- Cite sources for any statistics
- Format URLs as proper markdown links
- Limit response to 5-7 key points

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
      max_tokens: 800, // Increased for structured output
      temperature: 0.7, // Balanced between creativity and focus
      response_format: { type: "json_object" } // Enable structured JSON output
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
    console.log("Successfully completed chat with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting chat completion:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
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
    let systemContent = `You are Asha AI, a job specialist for the JobsForHer platform focused on women's employment opportunities.

CURRENT CONTEXT:
${ragData.statistics?.map(s => `- ${s.value} (Source: ${s.source})`).join('\n') || 'No current statistics available'}

RELEVANT RESOURCES:
${ragData.resources?.map(r => `- [${r.text}](${r.url})`).join('\n') || 'No specific resources available'}

RESPONSE FORMAT:
1. Start with an empathetic understanding of the career situation
2. Provide specific, actionable career advice
3. Include relevant industry statistics when available
4. Reference specific learning resources or job opportunities
5. End with a prompt for next steps

FORMATTING RULES:
- Use **bold** for key skills and job titles
- Include emoji prefixes for better readability
- Keep advice practical and immediately actionable
- Cite sources for any statistics
- Format URLs as proper markdown links

CONSTRAINTS:
- Focus on women's career advancement
- Be culturally sensitive
- Use professional, encouraging tone
- Limit to 5-7 main points
- Include specific JobsForHer opportunities

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
    console.log("Successfully completed career advice with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting career advice:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
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
    console.error("Error getting mentorship info:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
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
          content: `You are an expert career counselor who specializes in analyzing career confidence levels from text. 
Your task is to assess the input text for:
1. Career confidence level (low/medium/high)
2. Emotional tone regarding career (negative/neutral/positive)
3. Level of support needed (high-support/moderate-support/light-support)

Consider these factors:
- Use of confident vs hesitant language
- Presence of career goals and planning
- Expression of career-related emotions
- Level of self-advocacy
- Requests for guidance or validation

OUTPUT FORMAT:
{
  "confidenceLevel": "low" | "medium" | "high",
  "emotionTone": "negative" | "neutral" | "positive",
  "supportLevel": "high-support" | "moderate-support" | "light-support",
  "reasoning": {
    "confidenceAnalysis": "string",
    "emotionAnalysis": "string",
    "supportAnalysis": "string"
  }
}`,
        },
        {
          role: "user" as const,
          content: text,
        },
      ],
      max_tokens: 400,
      temperature: 0.3, // Lower temperature for more consistent analysis
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