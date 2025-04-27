import { Groq } from "groq-sdk";

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface ChatCompletionRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
}

export async function getChatCompletion(request: ChatCompletionRequest): Promise<string> {
  try {
    console.log("Starting chat completion with Groq API");
    
    // Set a timeout of 15 seconds
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API request timed out after 10 seconds"));
      }, 10000);
    });
    
    const systemMessage = {
      role: "system" as const,
      content: "You are Asha AI, an intelligent, responsive, and ethical virtual assistant designed to solve user queries on any topic. Provide clear, concise, and helpful responses to user questions. Maintain a professional but friendly tone, organize information logically, and use emojis occasionally for visual appeal. When users ask questions, provide direct and practical answers with relevant details. Remember that your purpose is to assist users with any questions they might have, not specifically about careers or job matching.",
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
      max_tokens: 800, // Reduced tokens for faster response
      temperature: 0.7, // Balanced creativity vs determinism
    }).then(response => {
      return response.choices[0].message.content || "We regret to inform you that we are unable to process your request at this moment. Please try again or contact JobsForHer Foundation for assistance.";
    });

    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed chat with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting chat completion:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return "We're currently experiencing technical difficulties accessing our knowledge resources. Please try your request again in a few moments or contact JobsForHer support if the issue persists.";
  }
}

export async function getCareerAdvice(query: string): Promise<string> {
  try {
    console.log("Starting career advice request with Groq API");
    
    // Set a timeout of 15 seconds
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API career advice request timed out after 10 seconds"));
      }, 10000);
    });
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: "You are Asha AI, an intelligent, responsive, and ethical virtual assistant designed to solve user queries on any topic. Provide clear, concise, and helpful responses to user questions. Maintain a professional but friendly tone, organize information logically, and use emojis occasionally for visual appeal. When users ask questions, provide direct and practical answers with relevant details. Remember that your purpose is to assist users with any questions they might have, not specifically about careers or job matching.",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 800, // Reduced tokens for faster response
      temperature: 0.7, // Balanced creativity vs determinism
    }).then(response => {
      return response.choices[0].message.content || "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.";
    });

    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed career advice with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting career advice:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return "We apologize, but our career advisory service is temporarily unavailable. Please attempt your query again in a few moments or contact JobsForHer Foundation for immediate assistance with your career planning needs.";
  }
}

export async function getMentorshipInfo(query: string): Promise<string> {
  try {
    console.log("Starting mentorship info request with Groq API");
    
    // Set a timeout of 15 seconds
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API mentorship info request timed out after 10 seconds"));
      }, 10000);
    });
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: "You are Asha AI, an intelligent, responsive, and ethical virtual assistant designed to solve user queries on any topic. Provide clear, concise, and helpful responses to user questions. Maintain a professional but friendly tone, organize information logically, and use emojis occasionally for visual appeal. When users ask questions, provide direct and practical answers with relevant details. Remember that your purpose is to assist users with any questions they might have, not specifically about careers or job matching.",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 800, // Reduced tokens for faster response
      temperature: 0.7, // Balanced creativity vs determinism
    }).then(response => {
      return response.choices[0].message.content || "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.";
    });

    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed mentorship info with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting mentorship info:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return "We regret to inform you that our mentorship information services are temporarily unavailable. Please try your request again shortly or reach out to the JobsForHer Foundation directly for information regarding our mentorship programs and professional development opportunities.";
  }
}
