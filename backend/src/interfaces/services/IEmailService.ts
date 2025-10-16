export interface IEmailService {
  sendMail(to: string, subject: string, html: string): Promise<void>;
}