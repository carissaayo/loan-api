import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USERNAME'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Email sending failed');
    }
  }
  async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${this.configService.get<string>('APP_URL')}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USERNAME'),
      to: email,
      subject: 'Email Verification',
      text: `Click the link below to verify your email:\n\n${verificationLink}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);

      // Debug log
    } catch (error) {
      console.error('Error sending email:', error); // Debug log
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
