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
<<<<<<< Updated upstream
=======
  Tags,
  Settings,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  { name: 'Subscription Types', href: '/admin/subscription-types', icon: Tags },
  { name: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
>>>>>>> Stashed changes
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
    <div className="hidden md:block w-64 gradient-primary shadow-2xl">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3 font-bold text-white hover:opacity-90 transition-opacity">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-lg">{APP_NAME}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-3 text-sm font-medium gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                    isActive
                      ? 'bg-white text-primary shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
            
            {isSuperAdmin && (
              <>
                <div className="my-3 border-t border-white/20" />
                <div className="px-4 py-2 text-xs font-bold text-white/60 uppercase tracking-wider">
                  Administration
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                        isActive
                          ? 'bg-white text-primary shadow-lg'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
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
