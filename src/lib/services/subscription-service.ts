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
      icon: sub.icon,
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
      icon: us.subscription.icon,
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
        members: {
          where: { isActive: true },
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
      icon: sub.icon,
      description: sub.description,
      totalAmount: Number(sub.totalAmount),
      totalMembers: sub.totalMembers,
      paymentType: sub.paymentType,
      isActive: sub.isActive,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
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
    return await prisma.subscription.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        description: dto.description,
        totalAmount: dto.totalAmount,
        paymentType: dto.paymentType as any,
        totalMembers: dto.totalMembers,
        createdBy: userId,
        isActive: true,
      },
    })
  }

  async updateSubscription(id: string, dto: any) {
    return await prisma.subscription.update({
      where: { id },
      data: {
        name: dto.name,
        icon: dto.icon,
        description: dto.description,
        totalAmount: dto.totalAmount,
        totalMembers: dto.totalMembers,
        paymentType: dto.paymentType,
      },
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
