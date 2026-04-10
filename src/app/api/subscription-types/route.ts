import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return only active types for all authenticated users
    const types = await prisma.subscriptionType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching subscription types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
