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
    const { sendEmail } = body

    let result
    
    if (sendEmail) {
      result = await invoiceService.generateAndEmailAllInvoices(session.user.id)
      
      return NextResponse.json({
        success: true,
        message: `Generated ${result.count} invoices, ${result.emailedCount} emailed successfully`,
        count: result.count,
        emailedCount: result.emailedCount,
        invoices: result.invoices,
      })
    } else {
      result = await invoiceService.generateInvoicesForAllUsers(session.user.id)
      
      return NextResponse.json({
        success: true,
        message: `Generated ${result.count} invoices successfully`,
        count: result.count,
        invoices: result.invoices,
      })
    }
  } catch (error) {
    console.error('Error generating invoices for all users:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate invoices' 
      },
      { status: 500 }
    )
  }
}
