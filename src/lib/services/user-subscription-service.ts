import { prisma } from '@/lib/prisma'
import type { UserSubscription, AddMemberDto } from '@/lib/types'

export class UserSubscriptionService {
  async addMember(subscriptionId: string, dto: AddMemberDto): Promise<UserSubscription> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return await prisma.userSubscription.create({
      data: {
        subscriptionId,
        subscriberUserId: user.id,
        amount: dto.amount || 0,
        isActive: true,
      },
    }) as any
  }

  async removeMember(userSubscriptionId: string): Promise<void> {
    await prisma.userSubscription.update({
      where: { id: userSubscriptionId },
      data: { isActive: false },
    })
  }

  async updateMemberAmount(userSubscriptionId: string, amount: number): Promise<void> {
    await prisma.userSubscription.update({
      where: { id: userSubscriptionId },
      data: { amount },
    })
  }

  async getMembers(subscriptionId: string) {
    return await prisma.userSubscription.findMany({
      where: {
        subscriptionId,
        isActive: true,
      },
      include: {
        subscriber: true,
      },
    })
  }

  async getMemberById(id: string) {
    return await prisma.userSubscription.findUnique({
      where: { id },
    })
  }
}
