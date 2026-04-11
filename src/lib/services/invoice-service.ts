import { prisma } from '@/lib/prisma'
import type { Invoice, GenerateInvoiceDto } from '@/lib/types'
import { EmailService } from './email-service'

const emailService = new EmailService()

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
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        userSubscription: {
          include: {
            subscription: {
              include: {
                owner: true,
              },
            },
          },
        },
        issuedTo: true,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    try {
      await emailService.sendInvoiceEmail(invoice.issuedTo.email, {
        invoiceId: invoice.id,
        subscriptionName: invoice.userSubscription.subscription.name,
        totalAmount: Number(invoice.totalAmount),
        monthsCovered: invoice.monthsCovered,
        ownerName: invoice.userSubscription.subscription.owner.fullName,
        ownerEmail: invoice.userSubscription.subscription.owner.email,
      })

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'sent',
          sentOn: new Date(),
        },
      })
    } catch (error) {
      console.error('Error sending invoice email:', error)
      throw error
    }
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

  async generateInvoiceForUser(userId: string, creatorUserId: string): Promise<Invoice> {
    const unpaidPayments = await prisma.payment.findMany({
      where: {
        isPaid: false,
        userSubscription: {
          subscriberUserId: userId,
          isActive: true,
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
        expiryDate: 'asc',
      },
    })

    if (unpaidPayments.length === 0) {
      throw new Error('No unpaid payments found for this user')
    }

    const totalAmount = unpaidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const monthsCovered = unpaidPayments
      .map((p) => p.expiryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
      .join(', ')

    const userSubscriptionId = unpaidPayments[0].userSubscriptionId

    return await prisma.invoice.create({
      data: {
        userSubscriptionId,
        issuedToUserId: userId,
        totalAmount,
        monthsCovered,
        status: 'generated',
        createdBy: creatorUserId,
      },
    }) as any
  }

  async generateInvoicesForAllUsers(creatorUserId: string): Promise<{
    count: number
    invoices: Invoice[]
  }> {
    const usersWithUnpaidPayments = await prisma.payment.groupBy({
      by: ['userSubscriptionId'],
      where: {
        isPaid: false,
      },
      _count: true,
    })

    const invoices: Invoice[] = []

    for (const group of usersWithUnpaidPayments) {
      try {
        const userSub = await prisma.userSubscription.findUnique({
          where: { id: group.userSubscriptionId },
        })

        if (userSub && userSub.isActive) {
          const invoice = await this.generateInvoiceForUser(
            userSub.subscriberUserId,
            creatorUserId
          )
          invoices.push(invoice)
        }
      } catch (error) {
        console.error(`Error generating invoice for user subscription ${group.userSubscriptionId}:`, error)
      }
    }

    return {
      count: invoices.length,
      invoices,
    }
  }

  async generateAndEmailInvoice(userId: string, creatorUserId: string): Promise<Invoice> {
    const invoice = await this.generateInvoiceForUser(userId, creatorUserId)

    try {
      await this.sendInvoice(invoice.id)
    } catch (error) {
      console.error('Error emailing invoice:', error)
      console.log('Invoice generated but email failed. Invoice ID:', invoice.id)
    }

    return invoice
  }

  async generateAndEmailAllInvoices(creatorUserId: string): Promise<{
    count: number
    emailedCount: number
    invoices: Invoice[]
  }> {
    const result = await this.generateInvoicesForAllUsers(creatorUserId)
    let emailedCount = 0

    for (const invoice of result.invoices) {
      try {
        await this.sendInvoice(invoice.id)
        emailedCount++
      } catch (error) {
        console.error(`Error emailing invoice ${invoice.id}:`, error)
      }
    }

    return {
      count: result.count,
      emailedCount,
      invoices: result.invoices,
    }
  }
}
