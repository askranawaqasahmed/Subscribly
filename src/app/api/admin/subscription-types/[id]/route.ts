import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, icon, description, isActive } = body

    const type = await prisma.subscriptionType.update({
      where: { id },
      data: {
        name,
        icon,
        description,
        isActive,
      },
    })

    return NextResponse.json(type)
  } catch (error) {
    console.error('Error updating subscription type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    // Soft delete by setting isActive to false
    const type = await prisma.subscriptionType.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json(type)
  } catch (error) {
    console.error('Error deleting subscription type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
