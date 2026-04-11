import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { EmailService } from '@/lib/services/email-service'
import type { EmailConfig } from '@/lib/services/settings-service'

const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { provider, config } = body as { provider: string; config: any }

    if (!provider || !config) {
      return NextResponse.json(
        { error: 'Provider and config are required' },
        { status: 400 }
      )
    }

    const emailConfig: EmailConfig = {
      provider: provider as 'gmail' | 'resend',
      gmail: provider === 'gmail' ? config : undefined,
      resend: provider === 'resend' ? config : undefined,
    }

    if (provider === 'gmail' && emailConfig.gmail) {
      if (!emailConfig.gmail.host || !emailConfig.gmail.port || !emailConfig.gmail.user || 
          !emailConfig.gmail.password || !emailConfig.gmail.fromEmail) {
        return NextResponse.json(
          { error: 'Missing required Gmail configuration fields' },
          { status: 400 }
        )
      }
    }

    if (provider === 'resend' && emailConfig.resend) {
      if (!emailConfig.resend.apiKey || !emailConfig.resend.fromEmail) {
        return NextResponse.json(
          { error: 'Missing required Resend configuration fields' },
          { status: 400 }
        )
      }
    }

    await emailService.testEmailConfiguration(emailConfig, session.user.email)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${session.user.email}`,
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email' 
      },
      { status: 500 }
    )
  }
}
