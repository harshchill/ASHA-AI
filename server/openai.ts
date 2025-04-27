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
      content: "You are Asha AI, an intelligent, responsive, and ethical virtual assistant developed for the JobsForHer Foundation platform. You help users explore career opportunities, mentorships, and more. Keep your answers concise, helpful, and focused on women's career development and JobsForHer services. Your tone should be warm, professional, and encouraging.",
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
      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response at this time.";
    });

    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed chat with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting chat completion:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return "I'm having trouble connecting to my knowledge base. Please try again in a moment.";
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
          content: "You are Asha AI, a specialized career advisor for women. Provide concise, actionable career advice related to the JobsForHer Foundation. Focus on empowering women in their career journeys, helping them overcome barriers, and connecting them with relevant opportunities.",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 1024, // Limit response length
    }).then(response => {
      return response.choices[0].message.content || "I'm sorry, I couldn't generate career advice at this time.";
    });

    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed career advice with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting career advice:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return "I'm having trouble providing career advice right now. Please try again later.";
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
          content: "You are Asha AI, a mentorship program specialist for the JobsForHer Foundation. Provide information about mentorship programs, how to find mentors, and the benefits of mentorship for women's career development. Be concise and helpful.",
        },
        {
          role: "user" as const,
          content: query,
        },
      ],
      max_tokens: 1024, // Limit response length
    }).then(response => {
      return response.choices[0].message.content || "I'm sorry, I couldn't generate mentorship information at this time.";
    });

    // Race between the API call and the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log("Successfully completed mentorship info with Groq API");
    return response;
  } catch (error) {
    console.error("Error getting mentorship info:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return "I'm having trouble providing mentorship information right now. Please try again later.";
  }
}
