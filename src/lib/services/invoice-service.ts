import { prisma } from '@/lib/prisma'
import type { Invoice, GenerateInvoiceDto } from '@/lib/types'

export class InvoiceService {
  async generateInvoice(userId: string, dto: GenerateInvoiceDto): Promise<Invoice> {
    const payments = await prisma.payment.findMany({
      where: {
        id: { in: dto.payment_ids },
      },
      include: {
        userSubscription: true,
      },
    })

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const monthsCovered = payments
      .map((p) => p.expiryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
      .join(', ')

    const userSubscriptionId = payments[0]?.userSubscriptionId

    const userSub = await prisma.userSubscription.findUnique({
      where: { id: userSubscriptionId },
    })

    return await prisma.invoice.create({
      data: {
        userSubscriptionId,
        issuedToUserId: userSub!.subscriberUserId,
        totalAmount,
        monthsCovered,
        status: 'generated',
        createdBy: userId,
      },
    }) as any
  }

  async getInvoiceById(id: string) {
    return await prisma.invoice.findUnique({
      where: { id },
      include: {
        userSubscription: {
          include: {
            subscription: true,
            subscriber: true,
          },
        },
        creator: true,
      },
    })
  }

  async getInvoicesBySubscription(subscriptionId: string) {
    return await prisma.invoice.findMany({
      where: {
        userSubscription: {
          subscriptionId,
        },
      },
      include: {
        userSubscription: {
          include: {
            subscriber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async getInvoicesByUser(userId: string) {
    return await prisma.invoice.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { issuedToUserId: userId },
        ],
      },
      include: {
        userSubscription: {
          include: {
            subscription: true,
            subscriber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async sendInvoice(invoiceId: string): Promise<void> {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        sentOn: new Date(),
      },
    })
  }

  async markInvoiceAsPaid(invoiceId: string): Promise<void> {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidOn: new Date(),
      },
    })
  }
}
