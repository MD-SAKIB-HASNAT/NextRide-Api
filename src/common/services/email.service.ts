import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private mailer: nodemailer.Transporter;
  private logger = new Logger(EmailService.name);

  constructor() {
    this.initializeMailer();
  }

  private initializeMailer() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (user && pass) {
      this.mailer = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
     // this.logger.log('EmailService configured with Gmail transporter');
    } else {
     // this.logger.warn('EMAIL_USER/EMAIL_PASSWORD not set; emails will be logged only.');
    }
  }

  async sendEmail(to: string, subject: string, html: string, from?: string) {
    try {
      const fromEmail = from || process.env.EMAIL_USER || 'no-reply@nextride.com';
      
      if (!this.mailer) {
        this.logger.log(`Email (mock): to=${to}, subject=${subject}`);
        this.logger.debug(html);
        return { mocked: true };
      }

      const info = await this.mailer.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });
     // this.logger.log(`Email sent: to=${to}, subject=${subject}`);
      return info;
    } catch (error) {
     // this.logger.error('Failed to send email', error.stack || String(error));
      throw new Error('Failed to send email');
    }
  }
}
