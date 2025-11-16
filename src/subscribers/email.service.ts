import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Only create transporter if SMTP is configured
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendNewPostNotification(post: any, subscribers: string[]) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping notification.');
      return;
    }

    const html = `
      <h2>New Blog Post: ${post.title}</h2>
      <p>By ${post.author}</p>
      <div>${post.content}</div>
      <p>Read more on our blog!</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@blog.com',
      to: subscribers,
      subject: `New Post: ${post.title}`,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${subscribers.length} subscribers`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendPostToEmail(email: string, post: any) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email.');
      return;
    }

    const html = `
      <h2>${post.title}</h2>
      <p>By ${post.author}</p>
      <div>${post.content}</div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@blog.com',
      to: email,
      subject: `Blog Post: ${post.title}`,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
