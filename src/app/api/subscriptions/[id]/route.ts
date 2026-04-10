import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { SubscriptionService } from '@/lib/services/subscription-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = new SubscriptionService()
    const subscription = await service.getSubscriptionDetails(id)

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('GET /api/subscriptions/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = new SubscriptionService()
    
    // Allow super admins to edit any subscription, otherwise check ownership
    if (session.user.role !== 'SUPER_ADMIN') {
      const isOwner = await service.isOwner(id, session.user.id)
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const subscription = await service.updateSubscription(id, body)

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('PUT /api/subscriptions/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = new SubscriptionService()
    
    // Allow super admins to delete any subscription, otherwise check ownership
    if (session.user.role !== 'SUPER_ADMIN') {
      const isOwner = await service.isOwner(id, session.user.id)
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await service.deleteSubscription(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/subscriptions/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
