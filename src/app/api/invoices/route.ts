import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoice-service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = new InvoiceService()
    
    // If super admin, return all invoices
    if (session.user.role === 'SUPER_ADMIN') {
      const allInvoices = await service.getAllInvoices()
      return NextResponse.json(allInvoices)
    }

    // For regular users, return their invoices
    const invoices = await service.getInvoicesByUser(session.user.id)

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const service = new InvoiceService()
    const invoice = await service.generateInvoice(session.user.id, body)

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('POST /api/invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
