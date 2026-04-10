import { prisma } from '@/lib/prisma'
import type { Payment, CreatePaymentDto } from '@/lib/types'

export class PaymentService {
  async createPayment(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    return await prisma.payment.create({
      data: {
        userSubscriptionId: dto.user_subscription_id,
        amount: dto.amount,
        expiryDate: new Date(dto.expiry_date),
        isPaid: false,
        createdBy: userId,
      },
    }) as any
  }

  async markAsPaid(paymentId: string): Promise<void> {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        isPaid: true,
        paidOn: new Date(),
      },
    })
  }

  async getPaymentsBySubscription(subscriptionId: string) {
    return await prisma.payment.findMany({
      where: {
        userSubscription: {
          subscriptionId,
        },
      },
      include: {
        userSubscription: {
          include: {
            subscriber: true,
            subscription: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async getPaymentsByUser(userId: string) {
    return await prisma.payment.findMany({
      where: {
        userSubscription: {
          subscriberUserId: userId,
        },
      },
      include: {
        userSubscription: {
          include: {
            subscription: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async getAccumulatedPending(subscriptionId: string) {
    const members = await prisma.userSubscription.findMany({
      where: {
        subscriptionId,
        isActive: true,
      },
      include: {
        subscriber: true,
        payments: {
          where: { isPaid: false },
          orderBy: { expiryDate: 'asc' },
        },
      },
    })

    return members
      .filter((m) => m.payments.length > 0)
      .map((m) => ({
        member_id: m.subscriberUserId,
        member_name: m.subscriber.fullName,
        member_email: m.subscriber.email,
        member_phone: m.subscriber.phoneNumber,
        months_unpaid: m.payments
          .map((p) => p.expiryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
          .join(', '),
        total_accumulated: m.payments.reduce((sum, p) => sum + Number(p.amount), 0),
        payment_ids: m.payments.map((p) => p.id),
      }))
  }

  async getAccumulatedPendingByOwner(ownerId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdBy: ownerId,
        isActive: true,
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            subscriber: true,
            payments: {
              where: { isPaid: false },
              orderBy: { expiryDate: 'asc' },
            },
          },
        },
      },
    })

    const result: any[] = []
    subscriptions.forEach((sub) => {
      sub.members
        .filter((m) => m.payments.length > 0)
        .forEach((m) => {
          result.push({
            subscription_id: sub.id,
            subscription_name: sub.name,
            member_id: m.subscriberUserId,
            member_name: m.subscriber.fullName,
            member_email: m.subscriber.email,
            member_phone: m.subscriber.phoneNumber,
            months_unpaid: m.payments
              .map((p) => p.expiryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
              .join(', '),
            total_accumulated: m.payments.reduce((sum, p) => sum + Number(p.amount), 0),
          })
        })
    })

    return result
  }

  async getPaymentById(id: string) {
    return await prisma.payment.findUnique({
      where: { id },
    })
  }
}
