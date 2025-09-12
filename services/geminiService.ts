import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { TicketStatus } from '../types';

export interface AnalysisResult {
  title: string;
  description: string;
  resolution: string | null;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High';
}

export type ConversationResult = {
  type: 'analysis';
  data: AnalysisResult;
} | {
  type: 'question';
  question: string;
} | {
  type: 'error';
  message: string;
};

// --- Private Helper Functions ---

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chat: Chat | null = null;

const schema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A short, descriptive ticket title. Max 10 words. Omit if asking a clarifying question."
        },
        description: {
            type: Type.STRING,
            description: "Detailed problem description based on video and text. Explain what you see and diagnose the issue. Omit if asking a clarifying question."
        },
        resolution: {
            type: Type.STRING,
            description: "Clear, step-by-step fix if known. If no fix is available, this field can be omitted or be an empty string. Omit if asking a clarifying question."
        },
        status: {
            type: Type.STRING,
            description: "Set status to 'AI Resolved' if the provided fix is simple and likely to work, 'Needs Attention' if user action is needed, or 'New' if no fix is found and it needs human review. Omit if asking a clarifying question.",
            enum: [TicketStatus.AI_RESOLVED, TicketStatus.NEEDS_ATTENTION, TicketStatus.NEW]
        },
        priority: {
            type: Type.STRING,
            description: "Assign priority based on impact: 'Low', 'Medium', or 'High'. Omit if asking a clarifying question.",
            enum: ['Low', 'Medium', 'High']
        },
        clarifyingQuestion: {
            type: Type.STRING,
            description: "If you lack sufficient information for a full analysis, ask one clear and concise question to the user. Omit this field if you have enough information."
        }
    },
};

const systemInstruction = `You are "FixDesk AI", an intelligent IT support assistant. Your purpose is to analyze user-submitted IT problems and gather enough information to create a structured ticket.

Analyze the user's text description and video recording.
1.  If you have enough information, diagnose the root cause and provide a full analysis. Your response MUST be a JSON object containing 'title', 'description', 'status', and 'priority'. Include 'resolution' if a clear fix exists.
2.  If the input is ambiguous or missing key details for a diagnosis, you MUST ask a single, clear, and concise clarifying question to the user. Your response MUST be a JSON object containing ONLY the 'clarifyingQuestion' field.
3.  Do not ask a question if you can make a reasonable inference. Only ask if the information is critical.
4.  Your entire response must be ONLY a single, valid JSON object that strictly adheres to the provided schema. Do not add any extra text, explanation, or markdown formatting.`;

const initializeChat = () => {
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });
};

const processResponse = (response: GenerateContentResponse): ConversationResult => {
    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result.clarifyingQuestion && typeof result.clarifyingQuestion === 'string') {
            return {
                type: 'question',
                question: result.clarifyingQuestion,
            };
        }

        if (result.title && result.description && result.status && result.priority) {
            return {
                type: 'analysis',
                data: {
                    title: result.title,
                    description: result.description,
                    status: result.status,
                    priority: result.priority,
                    resolution: result.resolution || null,
                }
            };
        }
        
        console.error("Invalid JSON structure from Gemini:", result);
        return { type: 'error', message: 'Received an invalid response from the AI.' };

    } catch (error) {
        console.error("Error processing Gemini response:", error, "Raw text:", response.text);
        return { type: 'error', message: 'Could not understand the response from the AI.' };
    }
};

const createErrorFallback = (prompt: string): ConversationResult => {
    return {
        type: 'analysis',
        data: {
          title: `Issue reported: "${prompt}"`,
          description: `An error occurred during AI analysis. A ticket has been created for manual review by IT support.`,
          resolution: null,
          status: TicketStatus.NEW,
          priority: 'Medium'
        }
    };
};

// --- Public API ---

export const startConversation = async (videoBlob: Blob, userPrompt: string): Promise<ConversationResult> => {
  try {
    console.log("Starting new AI conversation for prompt:", userPrompt);
    initializeChat(); // Start a new chat for each new issue
    if (!chat) throw new Error("Chat could not be initialized.");

    const base64Video = await blobToBase64(videoBlob);
    
    const response = await chat.sendMessage({
      message: [
        { text: `User's problem description: "${userPrompt}"` },
        { inlineData: { mimeType: videoBlob.type, data: base64Video } },
      ],
    });

    return processResponse(response);
  } catch (error) {
    console.error("Error calling Gemini API in startConversation:", error);
    return createErrorFallback(userPrompt);
  }
};

export const continueConversation = async (userResponse: string): Promise<ConversationResult> => {
    if (!chat) {
        console.error("continueConversation called before startConversation.");
        return createErrorFallback(userResponse);
    }
    try {
        console.log("Continuing AI conversation with user response:", userResponse);
        const response = await chat.sendMessage({ message: userResponse });
        return processResponse(response);
    } catch(error) {
        console.error("Error calling Gemini API in continueConversation:", error);
        return createErrorFallback(userResponse);
    }
};
