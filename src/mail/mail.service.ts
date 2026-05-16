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

  async sendNewEventEmail(data: {
    to: string[];
    societyName: string;
    title: string;
    date: string;
    eventUrl: string;
    registrationLink?: string | null;
  }): Promise<void> {
    const emailUser = this.configService.get<string>('EMAIL_USER');

    try {
      await this.transporter.sendMail({
        from: `"UniConnect" <${emailUser}>`,
        to: data.to,
        subject: `New Event Alert • ${data.societyName}`,
        html: `
        <h2>New Event Announcement</h2>

        <p>A new event has been posted by <strong>${data.societyName}</strong>.</p>

        <p>
          <strong>Event:</strong> ${data.title}
        </p>

        <p>
          <strong>Date:</strong> ${new Date(data.date).toLocaleString()}
        </p>

        <p>
          <a href="${data.eventUrl}">
            View Event
          </a>
        </p>

        ${data.registrationLink
            ? `
            <p>
              <a href="${data.registrationLink}">
                Register Here
              </a>
            </p>
          `
            : `
            <p>This event is open for everyone.</p>
          `
          }
      `,
      });
    } catch (error) {
      console.error('Error sending new event email:', error);
    }
  }

  async sendUpdatedEventEmail(data: {
    to: string[];
    societyName: string;
    title: string;
    date: string;
    eventUrl: string;
    registrationLink?: string | null;
  }): Promise<void> {
    const emailUser = this.configService.get<string>('EMAIL_USER');

    try {
      await this.transporter.sendMail({
        from: `"UniConnect" <${emailUser}>`,
        to: data.to,
        subject: `Event Updated • ${data.societyName}`,
        html: `
        <h2>Event Updated</h2>

        <p>
          An event from <strong>${data.societyName}</strong> has been updated.
        </p>

        <p>
          Please review the updated event details.
        </p>

        <p>
          <strong>Event:</strong> ${data.title}
        </p>

        <p>
          <strong>Date:</strong> ${new Date(data.date).toLocaleString()}
        </p>

        <p>
          <a href="${data.eventUrl}">
            View Updated Event
          </a>
        </p>

        ${data.registrationLink
            ? `
            <p>
              <a href="${data.registrationLink}">
                Registration Link
              </a>
            </p>
          `
            : `
            <p>This event is open for everyone.</p>
          `
          }
      `,
      });
    } catch (error) {
      console.error('Error sending updated event email:', error);
    }
  }

}
