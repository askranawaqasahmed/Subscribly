import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoice-service'

const invoiceService = new InvoiceService()

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
    const { billingDate: customBillingDate } = body

    const today = new Date()
    const billingDate = customBillingDate || today.getDate()

    if (billingDate < 1 || billingDate > 31) {
      return NextResponse.json(
        { error: 'Invalid billing date (must be 1-31)' },
        { status: 400 }
      )
    }

    const results = await invoiceService.generateInvoicesForBillingDate(
      billingDate,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      message: `Manual billing run completed for day ${billingDate}`,
      billingDate,
      ...results,
    })
  } catch (error) {
    console.error('Error running manual billing:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run billing',
      },
      { status: 500 }
    )
  }
}
