import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoice-service'

const invoiceService = new InvoiceService()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: subscriptionId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { month, year, sendEmail, preview } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month (must be 1-12)' },
        { status: 400 }
      )
    }

    // If preview mode, return preview data
    if (preview) {
      const previewData = await invoiceService.getInvoicePreviewForSubscription(
        subscriptionId,
        month,
        year
      )
      
      return NextResponse.json({
        success: true,
        preview: previewData,
      })
    }

    // Generate invoices
    const results = await invoiceService.generateInvoiceForSubscription(
      subscriptionId,
      month,
      year,
      session.user.id,
      sendEmail || false
    )

    const successCount = results.filter(r => r.success && !r.alreadyExists).length
    const alreadyExistsCount = results.filter(r => r.alreadyExists).length
    const failedCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} invoices${alreadyExistsCount > 0 ? `, ${alreadyExistsCount} already existed` : ''}${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      results,
      summary: {
        total: results.length,
        generated: successCount,
        alreadyExists: alreadyExistsCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error('Error generating invoices for subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate invoices',
      },
      { status: 500 }
    )
  }
}
