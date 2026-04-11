import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoice-service'

const invoiceService = new InvoiceService()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const invoiceId = params.id

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    await invoiceService.sendInvoice(invoiceId)

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
    })
  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send invoice' 
      },
      { status: 500 }
    )
  }
}
