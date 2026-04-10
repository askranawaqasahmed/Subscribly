import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    const types = await prisma.subscriptionType.findMany({
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, icon, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const type = await prisma.subscriptionType.create({
      data: {
        name,
        icon,
        description,
        isActive: true,
      },
    })

    return NextResponse.json(type, { status: 201 })
  } catch (error) {
    console.error('Error creating subscription type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
