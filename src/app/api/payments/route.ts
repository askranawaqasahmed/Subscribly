import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PaymentService } from '@/lib/services/payment-service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = new PaymentService()
    const payments = await service.getPaymentsByUser(session.user.id)

    return NextResponse.json(payments)
  } catch (error) {
    console.error('GET /api/payments error:', error)
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
    const service = new PaymentService()
    const payment = await service.createPayment(session.user.id, body)

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('POST /api/payments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
