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
      content: "You are Asha AI, a specialized assistant for the JobsForHer platform. Your purpose is to help women with job and career-related queries. Focus on providing information about job opportunities, skill development, mentorship programs, resume building, interviews, and workplace advancement. Use a professional tone with occasional emojis for visual appeal. Keep responses concise, direct, and specifically focused on women's career advancement. Avoid discussing non-job-related topics. Your goal is to empower women in their professional journeys through practical guidance and resources from JobsForHer.",
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
          content: "You are Asha AI, a career specialist for the JobsForHer platform focused on women's professional advancement. Provide structured career guidance for women including job search strategies, skill development pathways, and advancement opportunities. Format responses with clear organization using bullet points where appropriate. Include practical, actionable steps, keeping information relevant to JobsForHer's mission. Use occasional emojis for visual appeal, but maintain a professional tone throughout. Focus strictly on career-related topics.",
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
          content: "You are Asha AI, a mentorship specialist for the JobsForHer platform. Provide information about professional mentoring relationships, career guidance, and development opportunities specifically for women in the workforce. Use a professional tone while organizing information clearly with appropriate structure. Focus on practical mentorship benefits, finding suitable mentors, and maximizing mentoring relationships. Keep responses relevant to JobsForHer's mission of supporting women's career advancement through mentorship and professional development.",
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