import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service for handling generative AI operations
 */
export class AIService {
  private static instance: AIService;
  private genAI: GoogleGenerativeAI | null;
  private readonly modelName: string;

  private constructor() {
    this.genAI = process.env.GOOGLE_GENAI_API_KEY
      ? new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY)
      : null;
    this.modelName = process.env.GOOGLE_GENAI_MODEL || 'gemini-1.5-flash';
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate a response using the AI model
   * @param prompt The input prompt for the AI
   * @returns The generated text response
   */
  public async generateResponse(prompt: string): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('GOOGLE_GENAI_API_KEY is not configured');
      }

      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      if (!text) {
        throw new Error('AI model returned an empty response');
      }

      return text;
    } catch (error) {
      console.error(`Error generating AI response: ${error}`);
      throw new Error(`Failed to generate AI response: ${error}`);
    }
  }

  /**
   * Example flow for greeting
   * @param name The name to greet
   * @returns The greeting response
   */
  public async greet(name: string): Promise<string> {
    try {
      return await this.generateResponse(
        `Write a short, friendly greeting for ${name} welcoming them to WorkWise SA. Keep it under 25 words.`
      );
    } catch (error) {
      console.error(`Error in greet flow: ${error}`);
      throw new Error(`Failed to generate greeting: ${error}`);
    }
  }
}

// Export a singleton instance
export const aiService = AIService.getInstance(); 
