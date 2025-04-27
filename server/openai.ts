import { Groq } from "groq-sdk";

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
type SupportedLanguage = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'bengali';

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

export async function getChatCompletion(request: ChatCompletionRequest): Promise<string> {
  try {
    console.log("Starting chat completion with Groq API");
    
    // Set a timeout of 10 seconds for faster fallback
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API request timed out after 10 seconds"));
      }, 10000);
    });
    
    // Determine language from request or detect from last message
    const detectedLanguage = request.language || 
      (request.messages.length > 0 ? detectLanguage(request.messages[request.messages.length - 1].content) : 'english');
    
    console.log(`Detected or specified language: ${detectedLanguage}`);
    
    // Create language-specific system message
    let systemContent = "You are Asha AI, a specialized job assistant for the JobsForHer platform. Format your responses as follows:\n\n1. Be extremely concise and minimalist - use 5-7 key points maximum\n2. Use simple emoji prefixes for each point (no emoji variations)\n3. Bold only the most essential words or phrases\n4. Avoid unnecessary text, headings, or explanations\n5. Focus only on the most practical, actionable job advice\n6. Use simple bullet points with minimal structure\n7. Leave space between points for readability\n8. No introductions or conclusions needed\n9. Use plain language that's immediately actionable\n10. Focus solely on employment guidance for women";
    
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
      max_tokens: 600, // Reduced tokens for faster response
      temperature: 0.5, // More focused responses
    }).then(response => {
      const content = response.choices[0].message.content;
      if (!content) {
        // Provide language-specific fallback message
        if (detectedLanguage === 'hindi') {
          return "मुझे खेद है, मैं इस समय आपके करियर से संबंधित प्रश्न को संसाधित नहीं कर सकती। कृपया थोड़ी देर बाद फिर से प्रयास करें।";
        } else if (detectedLanguage === 'tamil') {
          return "மன்னிக்கவும், நான் தற்போது உங்கள் வேலை தொடர்பான வினவலை செயலாக்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.";
        } else if (detectedLanguage === 'telugu') {
          return "క్షమించండి, నేను ప్రస్తుతం మీ ఉద్యోగ సంబంధిత ప్రశ్నను ప్రాసెస్ చేయలేకపోతున్నాను. దయచేసి కొద్ది సేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
        } else if (detectedLanguage === 'kannada') {
          return "ಕ್ಷಮಿಸಿ, ನಾನು ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಉದ್ಯೋಗ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
        } else if (detectedLanguage === 'bengali') {
          return "দুঃখিত, আমি এই মুহূর্তে আপনার কর্মসংক্রান্ত প্রশ্ন প্রক্রিয়া করতে পারছি না। দয়া করে কিছুক্ষণ পরে আবার চেষ্টা করুন।";
        } else {
          return "I'm sorry, I couldn't process your job-related query at the moment. Please try again shortly.";
        }
      }
      return content;
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

export async function getCareerAdvice(query: string): Promise<string> {
  try {
    console.log("Starting career advice request with Groq API");
    
    // Set a timeout of 10 seconds
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API career advice request timed out after 10 seconds"));
      }, 10000);
    });
    
    // Detect language from the query
    const detectedLanguage = detectLanguage(query);
    console.log(`Detected language for career advice: ${detectedLanguage}`);
    
    // Create language-specific system message
    let systemContent = "You are Asha AI, a job specialist for the JobsForHer platform focused on women's employment opportunities. Format your responses as follows:\n\n1. Be extremely concise and minimalist - use 5-7 key points maximum\n2. Use simple emoji prefixes for each point (no emoji variations)\n3. Bold only the most essential words or phrases\n4. Avoid unnecessary text, headings, or explanations\n5. Focus only on the most practical, actionable advice\n6. Use simple bullet points with minimal structure\n7. Leave space between points for readability\n8. No introductions or conclusions needed\n9. Use plain language that's immediately actionable\n10. Focus solely on job-related guidance for women";
    
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
      max_tokens: 600, // Reduced tokens for faster response
      temperature: 0.5, // More focused responses
    }).then(response => {
      const content = response.choices[0].message.content;
      if (!content) {
        // Provide language-specific fallback message
        if (detectedLanguage === 'hindi') {
          return "मुझे खेद है, मैं इस समय आपके करियर सलाह अनुरोध को संसाधित नहीं कर सकती। कृपया थोड़ी देर बाद फिर से प्रयास करें।";
        } else if (detectedLanguage === 'tamil') {
          return "மன்னிக்கவும், நான் தற்போது உங்கள் தொழில் ஆலோசனை கோரிக்கையை செயலாக்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.";
        } else if (detectedLanguage === 'telugu') {
          return "క్షమించండి, నేను ప్రస్తుతం మీ కెరీర్ సలహా అభ్యర్థనను ప్రాసెస్ చేయలేకపోతున్నాను. దయచేసి కొద్ది సేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
        } else if (detectedLanguage === 'kannada') {
          return "ಕ್ಷಮಿಸಿ, ನಾನು ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ವೃತ್ತಿ ಸಲಹೆ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
        } else if (detectedLanguage === 'bengali') {
          return "দুঃখিত, আমি এই মুহূর্তে আপনার ক্যারিয়ার পরামর্শ অনুরোধ প্রক্রিয়া করতে পারছি না। দয়া করে কিছুক্ষণ পরে আবার চেষ্টা করুন।";
        } else {
          return "I'm sorry, I couldn't process your career advice request at the moment. Please try again shortly.";
        }
      }
      return content;
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
    
    // Detect language from the query
    const detectedLanguage = detectLanguage(query);
    console.log(`Detected language for mentorship info: ${detectedLanguage}`);
    
    // Create language-specific system message
    let systemContent = "You are Asha AI, a job mentorship specialist for the JobsForHer platform. Format your responses as follows:\n\n1. Be extremely concise and minimalist - use 5-7 key points maximum\n2. Use simple emoji prefixes for each point (no emoji variations)\n3. Bold only the most essential words or phrases\n4. Avoid unnecessary text, headings, or explanations\n5. Focus only on the most practical, actionable mentorship advice\n6. Use simple bullet points with minimal structure\n7. Leave space between points for readability\n8. No introductions or conclusions needed\n9. Use plain language that's immediately actionable\n10. Focus solely on job-related mentorship guidance for women";
    
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
      max_tokens: 600, // Reduced tokens for faster response
      temperature: 0.5, // More focused responses
    }).then(response => {
      const content = response.choices[0].message.content;
      if (!content) {
        // Provide language-specific fallback message
        if (detectedLanguage === 'hindi') {
          return "मुझे खेद है, मैं इस समय आपके मेंटरशिप अनुरोध को संसाधित नहीं कर सकती। कृपया थोड़ी देर बाद फिर से प्रयास करें।";
        } else if (detectedLanguage === 'tamil') {
          return "மன்னிக்கவும், நான் தற்போது உங்கள் வழிகாட்டல் தகவல் கோரிக்கையை செயலாக்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.";
        } else if (detectedLanguage === 'telugu') {
          return "క్షమించండి, నేను ప్రస్తుతం మీ మెంటర్‌షిప్ సమాచార అభ్యర్థనను ప్రాసెస్ చేయలేకపోతున్నాను. దయచేసి కొద్ది సేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
        } else if (detectedLanguage === 'kannada') {
          return "ಕ್ಷಮಿಸಿ, ನಾನು ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಮಾರ್ಗದರ್ಶನ ಮಾಹಿತಿ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
        } else if (detectedLanguage === 'bengali') {
          return "দুঃখিত, আমি এই মুহূর্তে আপনার মেন্টরশিপ তথ্য অনুরোধ প্রক্রিয়া করতে পারছি না। দয়া করে কিছুক্ষণ পরে আবার চেষ্টা করুন।";
        } else {
          return "I'm sorry, I couldn't process your mentorship information request at the moment. Please try again shortly.";
        }
      }
      return content;
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
  emotionTone: 'anxious' | 'neutral' | 'confident';
  supportLevel: 'high-support' | 'moderate-support' | 'minimal-guidance';
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
          content: "You are an expert career counselor who specializes in analyzing career confidence levels from text. Your task is to analyze the text and determine the user's career confidence level, emotional tone regarding career, and the level of support they need. Return only a JSON object with these three attributes: confidenceLevel, emotionTone, and supportLevel.",
        },
        {
          role: "user" as const,
          content: `Analyze this text for career confidence, emotional tone, and required support level: "${text}". Return as JSON with confidenceLevel (low/medium/high), emotionTone (anxious/neutral/confident), and supportLevel (high-support/moderate-support/minimal-guidance).`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
      temperature: 0.3,
    }).then(response => {
      const content = response.choices[0].message.content;
      if (!content) {
        // Default values if no content
        return {
          confidenceLevel: 'medium',
          emotionTone: 'neutral', 
          supportLevel: 'moderate-support'
        };
      }
      try {
        const result = JSON.parse(content);
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