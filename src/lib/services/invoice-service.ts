import { prisma } from '@/lib/prisma'

import type { Invoice, GenerateInvoiceDto, MemberInvoicePreviewDto, GenerateInvoiceResultDto } from '@/lib/types'
import { EmailService } from './email-service'

const emailService = new EmailService()
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export class InvoiceService {
  async getAllInvoices() {
    const invoices = await prisma.invoice.findMany({
      include: {
        userSubscription: {
          include: {
            subscription: {
              include: {
                owner: {
                  select: {
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
              },
            },
            subscriber: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            fullName: true,
            email: true,
          },
        },
        issuedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.id.substring(0, 8).toUpperCase(),
      totalAmount: Number(invoice.totalAmount),
      monthsCovered: invoice.monthsCovered,
      status: invoice.status,
      sentOn: invoice.sentOn?.toISOString() || null,
      paidOn: invoice.paidOn?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
      subscription: {
        id: invoice.userSubscription.subscription.id,
        name: invoice.userSubscription.subscription.name,
        icon: invoice.userSubscription.subscription.subscriptionType?.icon || null,
        owner: invoice.userSubscription.subscription.owner,
      },
      recipient: invoice.issuedTo,
      creator: invoice.creator,
    }))
  }


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
  async getInvoicePreviewForSubscription(
    subscriptionId: string, 
    month: number, 
    year: number
  ): Promise<MemberInvoicePreviewDto[]> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            subscriber: true,
          },
        },
      },
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const previews: MemberInvoicePreviewDto[] = []

    for (const member of subscription.members) {
      // Check if invoice already exists for this member for this month/year
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          userSubscriptionId: member.id,
          billingMonth: month,
          billingYear: year,
        },
      })

      // Get all unpaid invoices for this member in this subscription (arrears)
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          userSubscriptionId: member.id,
          status: { not: 'paid' },
          OR: [
            { billingYear: { lt: year } },
            { 
              billingYear: year, 
              billingMonth: { lt: month } 
            },
          ],
        },
        orderBy: [
          { billingYear: 'asc' },
          { billingMonth: 'asc' },
        ],
      })

      const arrearsAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
      const arrearsMonths = unpaidInvoices.map(inv => 
        `${MONTH_NAMES[inv.billingMonth - 1]} ${inv.billingYear}`
      )

      const currentMonthAmount = Number(member.amount)
      const totalAmount = currentMonthAmount + arrearsAmount

      previews.push({
        memberId: member.subscriberUserId,
        memberName: member.subscriber.fullName,
        memberEmail: member.subscriber.email,
        currentMonthAmount,
        arrearsAmount,
        arrearsMonths,
        totalAmount,
        alreadyGenerated: !!existingInvoice,
      })
    }

    return previews
  }

  async generateInvoiceForSubscription(
    subscriptionId: string,
    month: number,
    year: number,
    creatorUserId: string,
    sendEmail: boolean = false
  ): Promise<GenerateInvoiceResultDto[]> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            subscriber: true,
          },
        },
      },
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const results: GenerateInvoiceResultDto[] = []

    for (const member of subscription.members) {
      try {
        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            userSubscriptionId: member.id,
            billingMonth: month,
            billingYear: year,
          },
        })

        if (existingInvoice) {
          results.push({
            memberId: member.subscriberUserId,
            memberName: member.subscriber.fullName,
            success: true,
            invoiceId: existingInvoice.id,
            message: 'Invoice already exists for this month',
            alreadyExists: true,
          })

          // Optionally re-send email
          if (sendEmail) {
            try {
              await this.sendInvoice(existingInvoice.id)
            } catch (error) {
              console.error('Error re-sending invoice email:', error)
            }
          }

          continue
        }

        // Get unpaid invoices (arrears)
        const unpaidInvoices = await prisma.invoice.findMany({
          where: {
            userSubscriptionId: member.id,
            status: { not: 'paid' },
            OR: [
              { billingYear: { lt: year } },
              { 
                billingYear: year, 
                billingMonth: { lt: month } 
              },
            ],
          },
          orderBy: [
            { billingYear: 'asc' },
            { billingMonth: 'asc' },
          ],
        })

        const arrearsAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
        const currentMonthAmount = Number(member.amount)
        const totalAmount = currentMonthAmount + arrearsAmount

        // Build months covered string
        const arrearsMonths = unpaidInvoices.map(inv => 
          `${MONTH_NAMES[inv.billingMonth - 1]} ${inv.billingYear}`
        )
        const currentMonthStr = `${MONTH_NAMES[month - 1]} ${year}`
        const allMonths = arrearsMonths.length > 0 
          ? [...arrearsMonths, currentMonthStr].join(', ')
          : currentMonthStr

        // Create Payment record for current month
        const lastDayOfMonth = new Date(year, month, 0)
        await prisma.payment.create({
          data: {
            userSubscriptionId: member.id,
            amount: currentMonthAmount,
            expiryDate: lastDayOfMonth,
            isPaid: false,
            createdBy: creatorUserId,
          },
        })

        // Create Invoice
        const invoice = await prisma.invoice.create({
          data: {
            userSubscriptionId: member.id,
            issuedToUserId: member.subscriberUserId,
            totalAmount,
            monthsCovered: allMonths,
            billingMonth: month,
            billingYear: year,
            status: 'generated',
            createdBy: creatorUserId,
          },
        })

        // Send email if requested
        if (sendEmail) {
          try {
            await this.sendInvoice(invoice.id)
          } catch (error) {
            console.error('Error sending invoice email:', error)
          }
        }

        results.push({
          memberId: member.subscriberUserId,
          memberName: member.subscriber.fullName,
          success: true,
          invoiceId: invoice.id,
          message: 'Invoice generated successfully',
          alreadyExists: false,
        })
      } catch (error) {
        console.error(`Error generating invoice for member ${member.subscriberUserId}:`, error)
        results.push({
          memberId: member.subscriberUserId,
          memberName: member.subscriber.fullName,
          success: false,
          message: error instanceof Error ? error.message : 'Failed to generate invoice',
          alreadyExists: false,
        })
      }
    }

    return results
  }

  async generateInvoicesForBillingDate(
    billingDate: number,
    creatorUserId: string
  ): Promise<{
    count: number
    emailedCount: number
    subscriptions: string[]
    errors: string[]
  }> {
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    // Find all subscriptions with this billing date
    const subscriptions = await prisma.subscription.findMany({
      where: {
        billingDate,
        isActive: true,
      },
    })

    let count = 0
    let emailedCount = 0
    const processedSubscriptions: string[] = []
    const errors: string[] = []

    for (const subscription of subscriptions) {
      try {
        const results = await this.generateInvoiceForSubscription(
          subscription.id,
          currentMonth,
          currentYear,
          creatorUserId,
          true // Send email
        )

        // Count successful generations
        const successfulGenerations = results.filter(r => r.success && !r.alreadyExists).length
        count += successfulGenerations
        emailedCount += successfulGenerations

        processedSubscriptions.push(subscription.name)
      } catch (error) {
        const errorMsg = `${subscription.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(`Error generating invoices for subscription ${subscription.id}:`, error)
      }
    }

    return {
      count,
      emailedCount,
      subscriptions: processedSubscriptions,
      errors,
    }
  }
}
