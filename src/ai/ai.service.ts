import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different model names - use whichever works with your API key
    // Uncomment one at a time to test:
    //this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    // this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    // this.model = this.genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
     this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('Gemini AI initialized with model');
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    try {
      // System prompt for vehicle-related conversations
      const systemPrompt = `You are NextRide AI - a helpful assistant for buying and selling vehicles in Bangladesh. 
Your expertise includes:
- Vehicle purchasing and selling advice
- Vehicle models, features, and pricing information
- Maintenance and care tips
- NextRide platform guidance
- Vehicle documentation and registration in Bangladesh
- Vehicle safety and best practices

Guidelines:
- Keep responses concise and friendly
- Focus on vehicle-related topics
- If asked about unrelated topics, politely redirect to vehicles
- Use Bengali currency (৳) when mentioning prices
- Be helpful and knowledgeable about the NextRide platform`;

      // Format conversation history for Gemini
      const contents: any[] = [];

      // Add system prompt as first message
      if (conversationHistory.length === 0) {
        contents.push({
          role: 'user',
          parts: [{ text: systemPrompt }],
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand. I am NextRide AI assistant, ready to help with vehicle-related queries.' }],
        });
      }

      // Add conversation history
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      // Generate response
      const result = await this.model.generateContent({
        contents,
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(
        error.message || 'Failed to generate AI response from Gemini API',
      );
    }
  }
}