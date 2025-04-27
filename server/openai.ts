import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatCompletionRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
}

export async function getChatCompletion(request: ChatCompletionRequest): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const systemMessage = {
      role: "system" as const,
      content: "You are Asha AI, an intelligent, responsive, and ethical virtual assistant developed for the JobsForHer Foundation platform. You help users explore career opportunities, mentorships, and more. Keep your answers concise, helpful, and focused on women's career development and JobsForHer services. Your tone should be warm, professional, and encouraging.",
    };
    
    // Convert message format to comply with OpenAI API requirements
    const formattedMessages = request.messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [systemMessage, ...formattedMessages],
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error getting chat completion:", error);
    return "I'm having trouble connecting to my knowledge base. Please try again in a moment.";
  }
}

export async function getCareerAdvice(query: string): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate career advice at this time.";
  } catch (error) {
    console.error("Error getting career advice:", error);
    return "I'm having trouble providing career advice right now. Please try again later.";
  }
}

export async function getMentorshipInfo(query: string): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate mentorship information at this time.";
  } catch (error) {
    console.error("Error getting mentorship info:", error);
    return "I'm having trouble providing mentorship information right now. Please try again later.";
  }
}
