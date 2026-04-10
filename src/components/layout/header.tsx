'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

interface HeaderProps {
  user: {
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push(ROUTES.LOGIN)
    router.refresh()
  }

  const userInitials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-white/80 backdrop-blur-xl px-4 sm:px-6 shadow-sm">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
              <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-2 bg-white border shadow-lg" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-semibold leading-none text-slate-900">{user.name || 'User'}</p>
                <p className="text-xs leading-none text-slate-600">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer p-3 text-red-600 hover:text-red-700 focus:text-red-700 focus:bg-red-50 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
