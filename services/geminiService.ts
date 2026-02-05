
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, FormTheme, Form } from "../types";

export const generateQuestionsFromAI = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a list of 5-7 high-quality survey questions about: "${topic}". 
               Include a variety of types: CHOICE, TEXT, RATING, DATE.
               For CHOICE, provide 3-5 sensible options.
               Return a structured JSON array.`,
    config: {
      // Pro models require a non-zero thinking budget for reasoning tasks.
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
    const raw = JSON.parse(text);
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
    contents: `Based on this form title: "${title}" and description: "${description}", suggest a professional color palette.
               Return a JSON object with primaryColor (hex) and a short keyword for a background image (e.g., "minimalist", "coffee", "corporate").`,
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryColor: { type: Type.STRING },
          bgKeyword: { type: Type.STRING }
        },
        required: ["primaryColor", "bgKeyword"]
      }
    }
  });

  try {
    const res = JSON.parse(response.text || "{}");
    return {
      primaryColor: res.primaryColor || '#008272',
      backgroundColor: '#f3f2f1',
      backgroundImage: `https://source.unsplash.com/featured/?${res.bgKeyword || 'abstract'}`
    };
  } catch (e) {
    return { primaryColor: '#008272' };
  }
};

export const generateInsightsFromAI = async (form: Form): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const simplifiedResponses = form.responses.map(r => ({
    answers: r.answers
  }));

  const prompt = `Analyze the survey results for "${form.title}".
  Questions: ${form.questions.map(q => q.title).join(', ')}
  Responses: ${JSON.stringify(simplifiedResponses)}
  
  Provide a professional summary with:
  1. A 'Key Takeaways' section.
  2. A 'Sentiment Analysis' (Positive/Neutral/Negative).
  3. Three 'Actionable Recommendations'.
  
  Use Markdown formatting for a clean look. Keep it concise.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return response.text || "No insights could be generated at this time.";
  } catch (e) {
    console.error("AI Insights failed", e);
    return "Failed to connect to the AI analyst. Please try again later.";
  }
};
