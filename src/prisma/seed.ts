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

  // Create Dummy Subscriptions
  console.log('\n📦 Creating subscriptions...')

  // Netflix subscription owned by user1
  const netflix = await prisma.subscription.upsert({
    where: { id: 'netflix-sub-001' },
    update: {},
    create: {
      id: 'netflix-sub-001',
      name: 'Netflix Premium',
      icon: '🎬',
      description: 'Stream unlimited movies and TV shows',
      totalAmount: 19.99,
      totalMembers: 2,
      paymentType: 'equal',
      createdBy: user1.id,
      isActive: true,
    },
  })

  // Add members to Netflix
  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: netflix.id,
        subscriberUserId: user1.id,
      }
    },
    update: {},
    create: {
      subscriptionId: netflix.id,
      subscriberUserId: user1.id,
      amount: 10.00,
      isActive: true,
    },
  })

  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: netflix.id,
        subscriberUserId: user2.id,
      }
    },
    update: {},
    create: {
      subscriptionId: netflix.id,
      subscriberUserId: user2.id,
      amount: 9.99,
      isActive: true,
    },
  })

  console.log('✓ Created Netflix subscription with 2 members')

  // Spotify subscription owned by user2
  const spotify = await prisma.subscription.upsert({
    where: { id: 'spotify-sub-001' },
    update: {},
    create: {
      id: 'spotify-sub-001',
      name: 'Spotify Family',
      icon: '🎵',
      description: 'Music streaming for the whole family',
      totalAmount: 15.99,
      totalMembers: 2,
      paymentType: 'equal',
      createdBy: user2.id,
      isActive: true,
    },
  })

  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: spotify.id,
        subscriberUserId: user2.id,
      }
    },
    update: {},
    create: {
      subscriptionId: spotify.id,
      subscriberUserId: user2.id,
      amount: 8.00,
      isActive: true,
    },
  })

  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: spotify.id,
        subscriberUserId: user1.id,
      }
    },
    update: {},
    create: {
      subscriptionId: spotify.id,
      subscriberUserId: user1.id,
      amount: 7.99,
      isActive: true,
    },
  })

  console.log('✓ Created Spotify subscription with 2 members')

  // Disney+ subscription owned by admin
  const disney = await prisma.subscription.upsert({
    where: { id: 'disney-sub-001' },
    update: {},
    create: {
      id: 'disney-sub-001',
      name: 'Disney+ Premium',
      icon: '✨',
      description: 'Premium Disney, Pixar, Marvel, Star Wars',
      totalAmount: 12.99,
      totalMembers: 2,
      paymentType: 'individual',
      createdBy: superAdmin.id,
      isActive: true,
    },
  })

  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: disney.id,
        subscriberUserId: superAdmin.id,
      }
    },
    update: {},
    create: {
      subscriptionId: disney.id,
      subscriberUserId: superAdmin.id,
      amount: 7.00,
      isActive: true,
    },
  })

  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: disney.id,
        subscriberUserId: user1.id,
      }
    },
    update: {},
    create: {
      subscriptionId: disney.id,
      subscriberUserId: user1.id,
      amount: 5.99,
      isActive: true,
    },
  })

  console.log('✓ Created Disney+ subscription with 2 members')

  // YouTube Premium owned by user1
  const youtube = await prisma.subscription.upsert({
    where: { id: 'youtube-sub-001' },
    update: {},
    create: {
      id: 'youtube-sub-001',
      name: 'YouTube Premium Family',
      icon: '📺',
      description: 'Ad-free videos and YouTube Music Premium',
      totalAmount: 22.99,
      totalMembers: 2,
      paymentType: 'equal',
      createdBy: user1.id,
      isActive: true,
    },
  })

  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: youtube.id,
        subscriberUserId: user1.id,
      }
    },
    update: {},
    create: {
      subscriptionId: youtube.id,
      subscriberUserId: user1.id,
      amount: 11.50,
      isActive: true,
    },
  })

  await prisma.userSubscription.upsert({
    where: { 
      subscriptionId_subscriberUserId: {
        subscriptionId: youtube.id,
        subscriberUserId: user2.id,
      }
    },
    update: {},
    create: {
      subscriptionId: youtube.id,
      subscriberUserId: user2.id,
      amount: 11.49,
      isActive: true,
    },
  })

  console.log('✓ Created YouTube Premium subscription with 2 members')

  console.log('\n🌱 Seeding completed!')
  console.log('')
  console.log('Login credentials:')
  console.log('  Super Admin: superadmin@subscribly.com / admin123')
  console.log('  User 1:      user1@subscribly.com / user123')
  console.log('  User 2:      user2@subscribly.com / user123')
  console.log('')
  console.log('Dummy subscriptions created:')
  console.log('  • Netflix Premium (Owner: User 1)')
  console.log('  • Spotify Family (Owner: User 2)')
  console.log('  • Disney+ Premium (Owner: Admin)')
  console.log('  • YouTube Premium Family (Owner: User 1)')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
