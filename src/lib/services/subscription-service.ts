import { prisma } from '@/lib/prisma'
import type {
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  MySubscriptionDto,
} from '@/lib/types'
import { Prisma } from '@prisma/client'

export class SubscriptionService {
  async getMySubscriptions(userId: string): Promise<MySubscriptionDto[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdBy: userId,
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            payments: {
              where: { isPaid: false },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return subscriptions.map((sub) => ({
      id: sub.id,
      name: sub.name,
      total_amount: Number(sub.totalAmount),
      payment_type: sub.paymentType as any,
      member_count: sub.members.length,
      total_pending: sub.members.reduce(
        (sum, member) => sum + member.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
        0
      ),
      created_at: sub.createdAt.toISOString(),
    }))
  }

  async getSubscribedSubscriptions(userId: string) {
    const userSubs = await prisma.userSubscription.findMany({
      where: {
        subscriberUserId: userId,
        isActive: true,
      },
      include: {
        subscription: {
          include: {
            owner: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return userSubs.map((us) => ({
      id: us.subscription.id,
      name: us.subscription.name,
      my_amount: Number(us.amount),
      owner_name: us.subscription.owner.fullName,
      owner_email: us.subscription.owner.email,
      is_paid: us.payments[0]?.isPaid || false,
      last_payment_date: us.payments[0]?.paidOn?.toISOString() || null,
      created_at: us.createdAt.toISOString(),
    }))
  }

  async getAllSubscriptions() {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        subscriptionType: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        members: {
          include: {
            subscriber: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return subscriptions.map((sub) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      totalAmount: Number(sub.totalAmount),
      totalMembers: sub.totalMembers,
      paymentType: sub.paymentType,
      isActive: sub.isActive,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      subscriptionType: sub.subscriptionType,
      owner: sub.owner,
      members: sub.members.map((m) => ({
        id: m.id,
        amount: Number(m.amount),
        isActive: m.isActive,
        subscriber: m.subscriber,
      })),
    }))
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const sub = await prisma.subscription.findUnique({
      where: { id },
    })
    if (!sub) return null
    return sub as any
  }

  async getSubscriptionDetails(id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        owner: true,
        members: {
          where: { isActive: true },
          include: {
            subscriber: true,
            payments: true,
          },
        },
      },
    })

    if (!subscription) return null

    return {
      ...subscription,
      owner_name: subscription.owner.fullName,
      owner_email: subscription.owner.email,
      members: subscription.members.map((m) => ({
        member_id: m.subscriberUserId,
        member_name: m.subscriber.fullName,
        member_email: m.subscriber.email,
        member_phone: m.subscriber.phoneNumber,
        member_amount: Number(m.amount),
        member_accumulated_pending: m.payments
          .filter((p) => !p.isPaid)
          .reduce((sum, p) => sum + Number(p.amount), 0),
        member_last_paid_date: m.payments.find((p) => p.isPaid)?.paidOn?.toISOString() || null,
      })),
    }
  }

  async createSubscription(userId: string, dto: any) {
    const { memberUserIds, memberAmounts, paymentType, totalAmount, totalMembers, ...subscriptionData } = dto

    return await prisma.$transaction(async (tx) => {
      // Create the subscription
      const subscription = await tx.subscription.create({
        data: {
          name: subscriptionData.name,
          description: subscriptionData.description,
          totalAmount: totalAmount,
          paymentType: paymentType as any,
          totalMembers: totalMembers,
          subscriptionTypeId: subscriptionData.subscriptionTypeId || null,
          createdBy: userId,
          isActive: true,
        },
      })

      // Create UserSubscription records for each member
      if (memberUserIds && memberUserIds.length > 0) {
        const userSubscriptions = memberUserIds.map((memberId: string) => {
          const amount = paymentType === 'equal'
            ? totalAmount / memberUserIds.length
            : (memberAmounts?.[memberId] || 0)

          return tx.userSubscription.create({
            data: {
              subscriptionId: subscription.id,
              subscriberUserId: memberId,
              amount: amount,
              isActive: true,
            },
          })
        })

        await Promise.all(userSubscriptions)
      }

      return subscription
    })
  }

  async updateSubscription(id: string, dto: any) {
    const { memberUserIds, memberAmounts, paymentType, totalAmount, totalMembers, ...subscriptionData } = dto

    return await prisma.$transaction(async (tx) => {
      // Update the subscription
      const subscription = await tx.subscription.update({
        where: { id },
        data: {
          name: subscriptionData.name,
          description: subscriptionData.description,
          totalAmount: totalAmount,
          totalMembers: totalMembers,
          paymentType: paymentType,
          subscriptionTypeId: subscriptionData.subscriptionTypeId || null,
        },
      })

      // If memberUserIds is provided, update members
      if (memberUserIds && memberUserIds.length > 0) {
        // Deactivate all existing members
        await tx.userSubscription.updateMany({
          where: { subscriptionId: id },
          data: { isActive: false },
        })

        // Get existing members
        const existingMembers = await tx.userSubscription.findMany({
          where: { subscriptionId: id },
        })

        // Create or reactivate members
        const memberOperations = memberUserIds.map(async (memberId: string) => {
          const amount = paymentType === 'equal'
            ? totalAmount / memberUserIds.length
            : (memberAmounts?.[memberId] || 0)

          const existingMember = existingMembers.find(m => m.subscriberUserId === memberId)

          if (existingMember) {
            // Reactivate and update existing member
            return tx.userSubscription.update({
              where: { id: existingMember.id },
              data: {
                amount: amount,
                isActive: true,
              },
            })
          } else {
            // Create new member
            return tx.userSubscription.create({
              data: {
                subscriptionId: id,
                subscriberUserId: memberId,
                amount: amount,
                isActive: true,
              },
            })
          }
        })

        await Promise.all(memberOperations)
      }

      return subscription
    })
  }

  async deleteSubscription(id: string): Promise<void> {
    await prisma.subscription.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async isOwner(subscriptionId: string, userId: string): Promise<boolean> {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { createdBy: true },
    })
    return sub?.createdBy === userId
  }
}
