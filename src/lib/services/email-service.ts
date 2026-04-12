// Placeholder email service
// In production, integrate with Resend, SendGrid, or similar

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private fromEmail: string

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@subscribly.app'
  }

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

  private async sendEmail(data: EmailData): Promise<void> {
    // Placeholder implementation
    // In production, integrate with actual email service
    console.log('Email would be sent:', {
      to: data.to,
      subject: data.subject,
      from: data.from || this.fromEmail,
    })

    // Example integration with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: data.from || this.fromEmail,
    //   to: data.to,
    //   subject: data.subject,
    //   html: data.html,
    // })
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
