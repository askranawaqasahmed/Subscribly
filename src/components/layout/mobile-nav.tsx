'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
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

interface MobileNavProps {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: string
  }
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  
  const allNavigation = isSuperAdmin 
    ? [...navigation, { name: 'Users', href: '/admin/users', icon: Users }]
    : navigation

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <nav className="flex items-center justify-around">
        {allNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
