import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const usersWithUnpaidPayments = await prisma.payment.groupBy({
      by: ['userSubscriptionId'],
      where: {
        isPaid: false,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    })

    const userSubscriptionIds = usersWithUnpaidPayments.map(u => u.userSubscriptionId)

    const userSubscriptions = await prisma.userSubscription.findMany({
      where: {
        id: { in: userSubscriptionIds },
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
        subscription: {
          select: {
            name: true,
          },
        },
      },
    })

    const usersMap = new Map()

    for (const userSub of userSubscriptions) {
      const unpaidData = usersWithUnpaidPayments.find(
        u => u.userSubscriptionId === userSub.id
      )

      const userId = userSub.subscriber.id

      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          id: userSub.subscriber.id,
          fullName: userSub.subscriber.fullName,
          email: userSub.subscriber.email,
          unpaidCount: 0,
          unpaidAmount: 0,
          subscriptions: [],
        })
      }

      const userData = usersMap.get(userId)
      userData.unpaidCount += unpaidData?._count.id || 0
      userData.unpaidAmount += Number(unpaidData?._sum.amount || 0)
      userData.subscriptions.push(userSub.subscription.name)
    }

    const users = Array.from(usersMap.values())

    return NextResponse.json({
      users,
      total: users.length,
    })
  } catch (error) {
    console.error('Error fetching users with unpaid payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users with unpaid payments' },
      { status: 500 }
    )
  }
}
