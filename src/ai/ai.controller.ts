import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chat(
    @Body()
    chatDto: {
      message: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
  ) {
    if (!chatDto.message || chatDto.message.trim() === '') {
      throw new BadRequestException('Message cannot be empty');
    }

    try {
      const response = await this.aiService.generateResponse(
        chatDto.message,
        chatDto.conversationHistory || [],
      );
      return {
        success: true,
        data: {
          role: 'assistant',
          content: response,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to generate AI response',
      );
    }
  }
}
