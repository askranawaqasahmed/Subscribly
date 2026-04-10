import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@subscribly.com' },
    update: {},
    create: {
      email: 'superadmin@subscribly.com',
      password: adminPassword,
      fullName: 'Super Admin',
      phoneNumber: '+1234567890',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  })

  console.log('✓ Created Super Admin:', superAdmin.email)

  // Create User 1
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@subscribly.com' },
    update: {},
    create: {
      email: 'user1@subscribly.com',
      password: userPassword,
      fullName: 'Test User One',
      phoneNumber: '+1234567891',
      role: UserRole.USER,
      isActive: true,
    },
  })

  console.log('✓ Created User 1:', user1.email)

  // Create User 2
  const user2 = await prisma.user.upsert({
    where: { email: 'user2@subscribly.com' },
    update: {},
    create: {
      email: 'user2@subscribly.com',
      password: userPassword,
      fullName: 'Test User Two',
      phoneNumber: '+1234567892',
      role: UserRole.USER,
      isActive: true,
    },
  })

  console.log('✓ Created User 2:', user2.email)

  console.log('🌱 Seeding completed!')
  console.log('')
  console.log('Login credentials:')
  console.log('  Super Admin: superadmin@subscribly.com / admin123')
  console.log('  User 1:      user1@subscribly.com / user123')
  console.log('  User 2:      user2@subscribly.com / user123')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
