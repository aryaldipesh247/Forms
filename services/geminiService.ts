
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, FormTheme, Form } from "../types";
import { uploadImageToCloudinary } from "./cloudinaryService";

export const generateQuestionsFromAI = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a list of 5-7 high-quality survey questions about: "${topic}". 
               Include a variety of types: CHOICE, TEXT, DATE.
               For CHOICE, provide 3-5 sensible options.
               Return a structured JSON array.`,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { 
              type: Type.STRING,
              description: "One of: CHOICE, TEXT, DATE"
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Only for CHOICE type"
            },
            required: { type: Type.BOOLEAN }
          },
          required: ["title", "type"]
        }
      }
    }
  });

  try {
    const text = response.text || "[]";
    const raw = JSON.parse(text.trim());
    return raw.map((q: any) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9),
      required: q.required ?? false,
      options: q.options?.map((o: string) => ({ 
        id: Math.random().toString(36).substr(2, 9), 
        text: o 
      })) || (q.type === 'CHOICE' ? [{ id: '1', text: 'Option 1' }] : undefined)
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const suggestThemeFromAI = async (title: string, description: string): Promise<Partial<FormTheme>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this form title: "${title}" and content, suggest a professional color palette and theme metadata.
               Return a JSON object with primaryColor (hex), backgroundColor (hex), and a visualPrompt for a background image.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryColor: { type: Type.STRING },
          backgroundColor: { type: Type.STRING },
          visualPrompt: { type: Type.STRING }
        },
        required: ["primaryColor", "backgroundColor", "visualPrompt"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    const res = JSON.parse(text.trim());
    return {
      primaryColor: res.primaryColor || '#008272',
      backgroundColor: res.backgroundColor || '#f3f2f1',
      themePreset: res.visualPrompt
    };
  } catch (e) {
    return { primaryColor: '#008272' };
  }
};

export const generateBackgroundImageAI = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High-resolution, professional, 4k, minimalist background for a survey form. Deeply aesthetic, clean, and modern. Subject: ${prompt}` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          return await uploadImageToCloudinary(base64);
        }
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};

export const generateInsightsFromAI = async (form: Form): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const responses = form.responses ?? [];
  const questions = form.questions ?? [];

  const simplifiedResponses = responses.map(r => ({
    answers: r.answers
  }));

  const prompt = `Analyze the survey results for "${form.title}".
  Questions: ${questions.map(q => q.title).join(', ')}
  Responses: ${JSON.stringify(simplifiedResponses)}
  
  Provide a professional summary with Key Takeaways and Recommendations. Use Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "No insights could be generated at this time.";
  } catch (e) {
    console.error("AI Insights failed", e);
    return "Failed to connect to the AI analyst.";
  }
};
