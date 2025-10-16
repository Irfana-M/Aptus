import nodemailer from 'nodemailer';
import type { IEmailService } from '../interfaces/services/IEmailService.js';

export class NodemailerService implements IEmailService {
  private _transporter;

  constructor() {
    this._transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    await this._transporter.sendMail({
      from: `"Mentora App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }
}