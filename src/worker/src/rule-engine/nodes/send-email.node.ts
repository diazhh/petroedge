import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import nodemailer from 'nodemailer';

export interface SendEmailConfig extends RuleNodeConfig {
  to: string | string[]; // Recipient(s)
  subject: string; // Email subject (supports templates)
  body: string; // Email body (supports templates)
  from?: string; // Sender (default: from env)
  cc?: string | string[]; // CC recipients
  bcc?: string | string[]; // BCC recipients
  isHtml?: boolean; // Body is HTML (default: false)
  attachments?: Array<{ filename: string; path: string }>; // Attachments
}

/**
 * Send Email Node
 * 
 * Sends email notifications using SMTP.
 * Supports templating with message data.
 * 
 * Config:
 * - to: Recipient email(s) (required)
 * - subject: Email subject (required)
 * - body: Email body (required)
 * - from: Sender email (optional, uses env default)
 * - cc: CC recipients (optional)
 * - bcc: BCC recipients (optional)
 * - isHtml: Body is HTML (default: false)
 * - attachments: File attachments (optional)
 * 
 * Template variables:
 * Use {{key}} syntax to insert message data
 * Example: "Alert for {{assetName}}: {{alarmMessage}}"
 */
export class SendEmailNode extends RuleNode {
  private transporter: nodemailer.Transporter | null = null;

  constructor(config: SendEmailConfig) {
    super('send_email', config);
    this.initTransporter();
  }

  private initTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('SMTP not configured, email sending will fail');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as SendEmailConfig;

    if (!this.transporter) {
      this.log(context, 'error', 'SMTP not configured');
      return null;
    }

    if (!config.to || !config.subject || !config.body) {
      this.log(context, 'error', 'Email config incomplete (to, subject, body required)');
      return null;
    }

    try {
      // Apply templates
      const subject = this.applyTemplate(config.subject, message.data);
      const body = this.applyTemplate(config.body, message.data);

      const mailOptions: nodemailer.SendMailOptions = {
        from: config.from || process.env.SMTP_FROM || process.env.SMTP_USER,
        to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
        subject,
        [config.isHtml ? 'html' : 'text']: body,
      };

      if (config.cc) {
        mailOptions.cc = Array.isArray(config.cc) ? config.cc.join(', ') : config.cc;
      }

      if (config.bcc) {
        mailOptions.bcc = Array.isArray(config.bcc) ? config.bcc.join(', ') : config.bcc;
      }

      if (config.attachments) {
        mailOptions.attachments = config.attachments;
      }

      await this.transporter.sendMail(mailOptions);

      this.log(context, 'info', 'Email sent successfully', {
        to: config.to,
        subject,
      });

      return message;
    } catch (error) {
      this.log(context, 'error', 'Failed to send email', { error });
      return null;
    }
  }

  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
