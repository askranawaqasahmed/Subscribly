import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { SubscriptionService } from '@/lib/services/subscription-service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = new SubscriptionService()
    
    // If super admin, return all subscriptions for management
    if (session.user.role === 'SUPER_ADMIN') {
      const allSubscriptions = await service.getAllSubscriptions()
      return NextResponse.json(allSubscriptions)
    }

    // For regular users, return their subscriptions
    const [mySubscriptions, subscribedSubscriptions] = await Promise.all([
      service.getMySubscriptions(session.user.id),
      service.getSubscribedSubscriptions(session.user.id),
    ])

    return NextResponse.json({
      mySubscriptions,
      subscribedSubscriptions,
    })
  } catch (error) {
    console.error('GET /api/subscriptions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const service = new SubscriptionService()
    const subscription = await service.createSubscription(session.user.id, body)

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('POST /api/subscriptions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
