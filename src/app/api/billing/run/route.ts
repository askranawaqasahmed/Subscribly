import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/services/invoice-service'

const invoiceService = new InvoiceService()

export async function POST(request: NextRequest) {
  try {
    // Secure with API key or basic auth for cron jobs
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.BILLING_CRON_API_KEY || 'your-secret-key-change-in-production'
    
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date()
    const billingDate = today.getDate()

    // Use a system user ID for cron jobs - you might want to create a dedicated system user
    const systemUserId = process.env.SYSTEM_USER_ID || 'system'

    const results = await invoiceService.generateInvoicesForBillingDate(
      billingDate,
      systemUserId
    )

    return NextResponse.json({
      success: true,
      message: `Billing run completed for day ${billingDate}`,
      billingDate,
      ...results,
    })
  } catch (error) {
    console.error('Error running billing:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run billing',
      },
      { status: 500 }
    )
  }
}
