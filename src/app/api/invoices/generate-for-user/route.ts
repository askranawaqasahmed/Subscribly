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
    const { userId, sendEmail } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    let invoice
    
    if (sendEmail) {
      invoice = await invoiceService.generateAndEmailInvoice(userId, session.user.id)
    } else {
      invoice = await invoiceService.generateInvoiceForUser(userId, session.user.id)
    }

    return NextResponse.json({
      success: true,
      message: sendEmail 
        ? 'Invoice generated and emailed successfully' 
        : 'Invoice generated successfully',
      invoice,
    })
  } catch (error) {
    console.error('Error generating invoice for user:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate invoice' 
      },
      { status: 500 }
    )
  }
}
