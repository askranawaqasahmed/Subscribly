'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { APP_NAME, ROUTES } from '@/lib/constants'
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  DollarSign,
  BarChart3,
  Users,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Subscriptions', href: ROUTES.SUBSCRIPTIONS, icon: CreditCard },
  { name: 'Payments', href: ROUTES.PAYMENTS, icon: DollarSign },
  { name: 'Invoices', href: ROUTES.INVOICES, icon: FileText },
  { name: 'Reports', href: ROUTES.PENDING_REPORT, icon: BarChart3 },
]

const adminNavigation = [
  { name: 'User Management', href: '/admin/users', icon: Users },
]

interface SidebarProps {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-6 w-6" />
            <span>{APP_NAME}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                    isActive
                      ? 'bg-primary text-primary-foreground hover:text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
            
            {isSuperAdmin && (
              <>
                <div className="my-2 border-t" />
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Admin
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                        isActive
                          ? 'bg-primary text-primary-foreground hover:text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
