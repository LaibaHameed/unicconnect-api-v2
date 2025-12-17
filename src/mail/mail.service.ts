import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    if (!emailUser || !emailPass) {
      throw new InternalServerErrorException(
        'EMAIL_USER or EMAIL_PASS is missing in environment variables',
      );
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } catch (error) {
      console.error('Error configuring mail transporter:', error);
      throw new InternalServerErrorException('Email configuration failed');
    }
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const emailUser = this.configService.get<string>('EMAIL_USER');

    try {
      await this.transporter.sendMail({
        from: `"UniConnect" <${emailUser}>`,
        to,
        subject: 'Verify your UniConnect email',
        text: `Your verification code is: ${code}`,
        html: `<p>Your verification code is: <strong>${code}</strong></p>`,
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

    async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const emailUser = this.configService.get<string>('EMAIL_USER');

    try {
      await this.transporter.sendMail({
        from: `"UniConnect" <${emailUser}>`,
        to,
        subject: 'Reset your UniConnect password',
        text: `Your password reset code is: ${code}`,
        html: `
          <p>You requested a password reset.</p>
          <p>Your reset code is: <strong>${code}</strong></p>
          <p>If you didn’t request this, ignore this email.</p>
        `,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

}
