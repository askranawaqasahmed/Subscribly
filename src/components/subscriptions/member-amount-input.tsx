'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface User {
  id: string
  fullName: string
  email: string
}

interface MemberAmountInputProps {
  users: User[]
  selectedUserIds: string[]
  memberAmounts: Record<string, number>
  onAmountChange: (userId: string, amount: number) => void
  onRemoveUser: (userId: string) => void
  paymentType: 'equal' | 'individual'
  totalAmount: string
  className?: string
}

export function MemberAmountInput({
  users,
  selectedUserIds,
  memberAmounts,
  onAmountChange,
  onRemoveUser,
  paymentType,
  totalAmount,
  className,
}: MemberAmountInputProps) {
  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id))

  const currentTotal = selectedUserIds.reduce((sum, userId) => {
    return sum + (memberAmounts[userId] || 0)
  }, 0)

  const maxTotalAmount = totalAmount ? parseFloat(totalAmount) : 0
  const isOverLimit = currentTotal > maxTotalAmount

  const getAmountValue = (userId: string) => {
    if (paymentType === 'equal') {
      return maxTotalAmount > 0 && selectedUserIds.length > 0
        ? (maxTotalAmount / selectedUserIds.length).toFixed(2)
        : '0.00'
    }
    return memberAmounts[userId] || ''
  }

  return (
    <div className={cn('space-y-3', className)}>
      {selectedUsers.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Member Name</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold text-right w-32">Amount</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={getAmountValue(user.id)}
                        onChange={(e) => {
                          if (paymentType === 'individual') {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            onAmountChange(user.id, value)
                          }
                        }}
                        disabled={paymentType === 'equal'}
                        className={cn(
                          'text-right w-full',
                          paymentType === 'equal' && 'bg-muted cursor-not-allowed'
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveUser(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {paymentType === 'individual' && (
            <div
              className={cn(
                'flex items-center justify-between p-3 border-2 rounded-lg',
                isOverLimit
                  ? 'border-destructive bg-destructive/5'
                  : 'border-primary bg-primary/5'
              )}
            >
              <span className="font-semibold">
                {isOverLimit ? 'Total Exceeds Limit!' : 'Current Total:'}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-lg font-bold',
                    isOverLimit ? 'text-destructive' : 'text-primary'
                  )}
                >
                  ${currentTotal.toFixed(2)}
                </span>
                {maxTotalAmount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    / ${maxTotalAmount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          No members selected
        </div>
      )}
    </div>
  )
}
