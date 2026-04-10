import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PaymentService } from '@/lib/services/payment-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = new PaymentService()
    await service.markAsPaid(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/payments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
