'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  amount: number
  isActive: boolean
  subscriber: {
    id: string
    fullName: string
    email: string
  }
}

interface MemberAvatarsProps {
  members: Member[]
  className?: string
}

function getInitials(name: string): string {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function MemberAvatars({ members, className }: MemberAvatarsProps) {
  const activeMembers = members.filter((m) => m.isActive)

  if (activeMembers.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No members
      </div>
    )
  }

  const firstMember = activeMembers[0]
  const remainingCount = activeMembers.length - 1

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={undefined} alt={firstMember.subscriber.fullName} />
          <AvatarFallback className="text-xs">
            {getInitials(firstMember.subscriber.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">
            {firstMember.subscriber.fullName}
          </span>
          <span className="text-xs text-muted-foreground">
            ${firstMember.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-help">
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs bg-white dark:bg-slate-800 border border-border shadow-lg">
              <div className="space-y-2">
                <div className="font-semibold text-xs text-foreground">All Members:</div>
                {activeMembers.map((member) => (
                  <div key={member.id} className="text-xs">
                    <div className="font-medium text-foreground">{member.subscriber.fullName}</div>
                    <div className="text-muted-foreground">
                      {member.subscriber.email} - ${member.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
