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
    
    // Set a timeout of 10 seconds for faster fallback
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq API request timed out after 10 seconds"));
      }, 10000);
    });
    
    const systemMessage = {
      role: "system" as const,
      content: "You are Asha AI, a specialized job assistant for the JobsForHer platform. Format your responses as follows:\n\n1. Be extremely concise and minimalist - use 5-7 key points maximum\n2. Use simple emoji prefixes for each point (no emoji variations)\n3. Bold only the most essential words or phrases\n4. Avoid unnecessary text, headings, or explanations\n5. Focus only on the most practical, actionable job advice\n6. Use simple bullet points with minimal structure\n7. Leave space between points for readability\n8. No introductions or conclusions needed\n9. Use plain language that's immediately actionable\n10. Focus solely on employment guidance for women",
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
      return response.choices[0].message.content || "I'm sorry, I couldn't process your job-related query at the moment. Please try again shortly.";
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
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: "You are Asha AI, a job specialist for the JobsForHer platform focused on women's employment opportunities. Format your responses as follows:\n\n1. Be extremely concise and minimalist - use 5-7 key points maximum\n2. Use simple emoji prefixes for each point (no emoji variations)\n3. Bold only the most essential words or phrases\n4. Avoid unnecessary text, headings, or explanations\n5. Focus only on the most practical, actionable advice\n6. Use simple bullet points with minimal structure\n7. Leave space between points for readability\n8. No introductions or conclusions needed\n9. Use plain language that's immediately actionable\n10. Focus solely on job-related guidance for women",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 600, // Reduced tokens for faster response
      temperature: 0.5, // More focused responses
    }).then(response => {
      return response.choices[0].message.content || "I'm sorry, I couldn't process your career advice request at the moment. Please try again shortly.";
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
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: "You are Asha AI, a job mentorship specialist for the JobsForHer platform. Format your responses as follows:\n\n1. Be extremely concise and minimalist - use 5-7 key points maximum\n2. Use simple emoji prefixes for each point (no emoji variations)\n3. Bold only the most essential words or phrases\n4. Avoid unnecessary text, headings, or explanations\n5. Focus only on the most practical, actionable mentorship advice\n6. Use simple bullet points with minimal structure\n7. Leave space between points for readability\n8. No introductions or conclusions needed\n9. Use plain language that's immediately actionable\n10. Focus solely on job-related mentorship guidance for women",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 600, // Reduced tokens for faster response
      temperature: 0.5, // More focused responses
    }).then(response => {
      return response.choices[0].message.content || "I'm sorry, I couldn't process your mentorship information request at the moment. Please try again shortly.";
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