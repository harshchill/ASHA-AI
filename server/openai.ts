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
        reject(new Error("Groq API request timed out after 15 seconds"));
      }, 15000);
    });
    
    const systemMessage = {
      role: "system" as const,
      content: "You are Asha AI, a professional assistant developed for the JobsForHer Foundation platform. Provide concise, authoritative, and useful information to help women advance their careers through opportunities, mentorships, and skill development. Always maintain a polished, business-appropriate tone with clear structure in your responses. Format information with appropriate spacing and organization. Address users respectfully and professionally. Avoid overly casual language, exclamation points, and excessive warmth. Focus on delivering high-quality, actionable information in a dignified manner suitable for a corporate environment.",
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
      max_tokens: 1024, // Limit response length
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
        reject(new Error("Groq API career advice request timed out after 15 seconds"));
      }, 15000);
    });
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: "You are Asha AI, a professional career advisor at the JobsForHer Foundation. Provide authoritative, structured career guidance for women professionals. Use a formal tone with proper business language. Format responses with clear sections and bullet points where appropriate. Include specific, actionable steps and measurable outcomes. Avoid casual language, exclamation points, and overly emotional expressions. Focus on evidence-based recommendations and industry best practices that can be implemented in a corporate setting.",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 1024, // Limit response length
    }).then(response => {
      return response.choices[0].message.content || "We regret to inform you that we are unable to generate career guidance at this time. Please try again later or contact the JobsForHer Foundation for personalized career consultation services.";
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
        reject(new Error("Groq API mentorship info request timed out after 15 seconds"));
      }, 15000);
    });
    
    // Promise that performs the actual API request
    const apiPromise = groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system" as const,
          content: "You are Asha AI, a professional mentorship program specialist at the JobsForHer Foundation. Provide structured, authoritative information about mentorship programs and professional development opportunities. Present information in a clear, formal business style with proper organization. Include specific program details, statistics, and evidence-based benefits of mentorship. Use appropriate business language and maintain a professional tone throughout. Organize responses with headings and bullet points as needed. Focus on actionable steps and measurable outcomes for career advancement.",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 1024, // Limit response length
    }).then(response => {
      return response.choices[0].message.content || "We regret to inform you that our mentorship information is temporarily unavailable. Please contact the JobsForHer Foundation directly for details about our ongoing mentorship programs and professional development initiatives.";
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
