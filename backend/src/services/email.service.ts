import { injectable } from 'inversify';
import nodemailer from "nodemailer";
import type { IEmailService } from "../interfaces/services/IEmailService";

@injectable()
export class NodemailerService implements IEmailService {
  private _transporter;

  constructor() {
    console.log("🔍 Email Configuration:", {
      user: process.env.EMAIL_USER,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      hasPassword: !!process.env.EMAIL_PASS,
    });

    this._transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    this._transporter.verify((error: any, success: any) => {
      if (error) {
        console.error("❌ Email transporter verification failed:", error);
      } else {
        console.log("✅ Email transporter is ready to send messages");
      }
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      console.log("🔍 Attempting to send email:", { to, subject });

      const result = await this._transporter.sendMail({
        from: `"Mentora App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });

      console.log("✅ Email sent successfully:", result.messageId);
    } catch (error: any) {
      console.error("❌ Email send failed:", error);
      throw error;
    }
  }
}
