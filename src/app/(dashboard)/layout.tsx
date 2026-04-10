import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ROUTES } from '@/lib/constants'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-1">
        <Sidebar user={session.user} />
        <div className="flex flex-1 flex-col">
          <Header user={session.user} />
          <main className="flex-1 p-4 sm:px-6 sm:py-6 md:gap-8 mb-16 md:mb-0">
            {children}
          </main>
        </div>
      </div>
      <MobileNav user={session.user} />
    </div>
  )
}
