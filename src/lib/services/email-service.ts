import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { settingsService } from './settings-service'
import type { EmailConfig } from './settings-service'

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private gmailTransporter: nodemailer.Transporter | null = null
  private resendClient: Resend | null = null

  async sendInvoiceEmail(
    toEmail: string,
    invoiceData: {
      invoiceId: string
      subscriptionName: string
      totalAmount: number
      monthsCovered: string
      ownerName: string
      ownerEmail: string
      currentMonthAmount?: number
      arrearsAmount?: number
      arrearsMonths?: string[]
    }
  ): Promise<void> {
    const emailHtml = this.generateInvoiceEmailTemplate(invoiceData)

    await this.sendEmail({
      to: toEmail,
      subject: `Invoice for ${invoiceData.subscriptionName} - ${invoiceData.monthsCovered}`,
      html: emailHtml,
    })
  }

  async sendPaymentReminderEmail(
    toEmail: string,
    reminderData: {
      subscriptionName: string
      amount: number
      dueDate: string
      ownerName: string
    }
  ): Promise<void> {
    const emailHtml = this.generateReminderEmailTemplate(reminderData)

    await this.sendEmail({
      to: toEmail,
      subject: `Payment Reminder: ${reminderData.subscriptionName}`,
      html: emailHtml,
    })
  }

  async testEmailConfiguration(config: EmailConfig, testEmail: string): Promise<void> {
    const testData: EmailData = {
      to: testEmail,
      subject: 'Test Email from Subscribly',
      html: this.generateTestEmailTemplate(),
    }

    if (config.provider === 'gmail' && config.gmail) {
      await this.sendWithGmail(testData, config.gmail)
    } else if (config.provider === 'resend' && config.resend) {
      await this.sendWithResend(testData, config.resend)
    } else {
      throw new Error('Invalid email configuration')
    }
  }

  private async sendEmail(data: EmailData): Promise<void> {
    const config = await settingsService.getEmailConfig()

    if (!config.provider) {
      throw new Error('Email not configured. Please configure email settings in Admin > Settings.')
    }

    if (config.provider === 'gmail' && config.gmail) {
      await this.sendWithGmail(data, config.gmail)
    } else if (config.provider === 'resend' && config.resend) {
      await this.sendWithResend(data, config.resend)
    } else {
      throw new Error(`Email provider ${config.provider} is not properly configured.`)
    }
  }

  private async sendWithGmail(
    data: EmailData,
    gmailConfig: NonNullable<EmailConfig['gmail']>
  ): Promise<void> {
    try {
      if (!this.gmailTransporter) {
        this.gmailTransporter = nodemailer.createTransport({
          host: gmailConfig.host,
          port: gmailConfig.port,
          secure: gmailConfig.port === 465,
          auth: {
            user: gmailConfig.user,
            pass: gmailConfig.password,
          },
        })
      }

      await this.gmailTransporter.sendMail({
        from: data.from || `"${gmailConfig.fromName}" <${gmailConfig.fromEmail}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      })

      console.log('Email sent successfully via Gmail SMTP to:', data.to)
    } catch (error) {
      console.error('Gmail SMTP error:', error)
      this.gmailTransporter = null
      throw new Error(`Failed to send email via Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendWithResend(
    data: EmailData,
    resendConfig: NonNullable<EmailConfig['resend']>
  ): Promise<void> {
    try {
      if (!this.resendClient) {
        this.resendClient = new Resend(resendConfig.apiKey)
      }

      await this.resendClient.emails.send({
        from: data.from || `${resendConfig.fromName} <${resendConfig.fromEmail}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      })

      console.log('Email sent successfully via Resend to:', data.to)
    } catch (error) {
      console.error('Resend error:', error)
      this.resendClient = null
      throw new Error(`Failed to send email via Resend: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private generateTestEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Test Email Success</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <p><strong>Congratulations!</strong></p>
                <p>Your email configuration is working correctly. This is a test email from Subscribly.</p>
              </div>
              <p>You can now use this email provider to send invoices and payment reminders.</p>
              <p>If you received this email, your email configuration has been successfully set up.</p>
            </div>
            <div class="footer">
              <p>This is a test email from Subscribly.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateInvoiceEmailTemplate(data: {
    invoiceId: string
    subscriptionName: string
    totalAmount: number
    monthsCovered: string
    ownerName: string
    ownerEmail: string
    currentMonthAmount?: number
    arrearsAmount?: number
    arrearsMonths?: string[]
  }): string {
    const hasArrears = data.arrearsAmount && data.arrearsAmount > 0
    
    const breakdownHtml = hasArrears && data.currentMonthAmount ? `
      <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">Invoice Breakdown:</p>
        ${data.arrearsMonths && data.arrearsMonths.length > 0 ? `
          <p style="margin: 5px 0; color: #856404;"><strong>Previous Unpaid (${data.arrearsMonths.join(', ')}):</strong> $${data.arrearsAmount.toFixed(2)}</p>
        ` : ''}
        <p style="margin: 5px 0;"><strong>Current Month:</strong> $${data.currentMonthAmount.toFixed(2)}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">
        <p style="margin: 5px 0; font-size: 18px;"><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
      </div>
    ` : ''

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .amount { font-size: 24px; font-weight: bold; color: #4f46e5; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice from Subscribly</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have received an invoice from <strong>${data.ownerName}</strong> for the subscription <strong>${data.subscriptionName}</strong>.</p>
              <div class="invoice-details">
                <p><strong>Invoice ID:</strong> ${data.invoiceId}</p>
                <p><strong>Subscription:</strong> ${data.subscriptionName}</p>
                <p><strong>Months Covered:</strong> ${data.monthsCovered}</p>
                ${breakdownHtml}
                ${!hasArrears ? `
                  <p><strong>Total Amount Due:</strong></p>
                  <p class="amount">$${data.totalAmount.toFixed(2)}</p>
                ` : ''}
              </div>
              ${hasArrears ? `
                <p style="color: #856404;"><strong>Note:</strong> This invoice includes outstanding amounts from previous months.</p>
              ` : ''}
              <p>Please contact ${data.ownerName} at ${data.ownerEmail} for payment instructions.</p>
              <p>Thank you!</p>
            </div>
            <div class="footer">
              <p>This is an automated email from Subscribly. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateReminderEmailTemplate(data: {
    subscriptionName: string
    amount: number
    dueDate: string
    ownerName: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>This is a friendly reminder that your payment for <strong>${data.subscriptionName}</strong> is due soon.</p>
              <div class="reminder-box">
                <p><strong>Subscription:</strong> ${data.subscriptionName}</p>
                <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
                <p><strong>Due Date:</strong> ${data.dueDate}</p>
                <p><strong>Owner:</strong> ${data.ownerName}</p>
              </div>
              <p>Please make your payment by the due date to avoid any disruption to the service.</p>
              <p>Thank you!</p>
            </div>
            <div class="footer">
              <p>This is an automated email from Subscribly. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}
