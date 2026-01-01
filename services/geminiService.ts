
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is not configured. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const streamChat = async (
  modelId: string,
  messages: Message[],
  systemPrompt: string,
  onChunk: (text: string) => void
) => {
  const ai = getClient();
  
  // Format messages for Gemini API
  const formattedContents = messages.map(m => {
    const parts: any[] = [{ text: m.content || " " }];
    
    // Add attachments if present
    if (m.attachments && m.attachments.length > 0) {
      m.attachments.forEach(attachment => {
        parts.push({
          inlineData: {
            mimeType: attachment.type,
            data: attachment.data
          }
        });
      });
    }

    return {
      role: m.role === Role.USER ? 'user' : 'model',
      parts
    };
  });

  try {
    const streamResponse = await ai.models.generateContentStream({
      model: modelId,
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      },
    });

    let fullText = "";
    for await (const chunk of streamResponse) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(text);
    }
    
    return fullText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a very short (max 4 words) title for a conversation starting with this message: "${message}". Return only the title text, no quotes.`,
    });
    return response.text || "New Conversation";
  } catch {
    return "New Conversation";
  }
};
