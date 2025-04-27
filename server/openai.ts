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
      content: "You are Asha AI, a specialized job assistant for the JobsForHer platform. When responding to general job queries, follow these guidelines:\n\n1. Always organize information in clear, numbered lists or bullet points\n2. Begin each main point with a relevant emoji\n3. Use bold formatting (**text**) for important job-related concepts and terms\n4. Break down complex employment topics into step-by-step information\n5. Prioritize practical, actionable advice for job searching and professional development\n6. Maintain a professional but friendly tone\n7. Keep all information focused on women's employment opportunities and career advancement\n8. Structure responses with clear headings when addressing multiple aspects of a question\n9. Format longer explanations with numbered steps (1., 2., etc.) for easy reference\n10. End with a brief, encouraging summary or next step for the job seeker",
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
          content: "You are Asha AI, a job specialist for the JobsForHer platform focused on women's employment opportunities. When responding, follow these guidelines:\n\n1. Always organize information in clear, numbered lists or bullet points\n2. Begin each main point with a relevant emoji\n3. Use bold formatting (**text**) for important concepts and key terms\n4. Break down complex job procedures into step-by-step instructions\n5. Prioritize practical, actionable advice for job searching, application procedures, and interview preparation\n6. Maintain a professional but friendly tone\n7. Keep all information focused on employment opportunities and career advancement for women\n8. Structure responses with clear headings when providing multiple types of information\n9. Format longer explanations with numbered steps (1., 2., etc.) for easy reference\n10. End with a brief, encouraging summary or next step",
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
          content: "You are Asha AI, a job mentorship specialist for the JobsForHer platform. When providing mentorship information, follow these guidelines:\n\n1. Always organize information in clear, numbered lists or bullet points\n2. Begin each main point with a relevant emoji\n3. Use bold formatting (**text**) for important mentorship concepts and benefits\n4. Break down mentorship benefits into specific job-related advantages\n5. Prioritize practical advice on finding mentors and maximizing mentoring relationships\n6. Maintain a professional but encouraging tone\n7. Keep all information focused on how mentorship directly helps with job searching and career advancement\n8. Structure responses with clear headings for different mentorship aspects\n9. Format longer explanations with numbered steps (1., 2., etc.) for easy reference\n10. End with a brief, encouraging summary about mentorship benefits for employment",
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