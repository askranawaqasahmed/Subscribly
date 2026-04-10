import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { userId, amount } = body

    if (!userId || !amount) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 })
    }

    // Check if user is owner of the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription || subscription.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if member already exists
    const existing = await prisma.userSubscription.findUnique({
      where: {
        subscriptionId_subscriberUserId: {
          subscriptionId,
          subscriberUserId: userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add member
    const member = await prisma.userSubscription.create({
      data: {
        subscriptionId,
        subscriberUserId: userId,
        amount: parseFloat(amount),
        isActive: true,
      },
      include: {
        subscriber: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
