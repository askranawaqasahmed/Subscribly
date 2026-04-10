'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Users } from 'lucide-react'

interface User {
  id: string
  email: string
  fullName: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user status')
      }

      const updatedUser = await response.json()
      
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ))

      toast.success(
        `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      )
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user status')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">User Management</h1>
          </div>
          <p className="text-white/90 text-lg">
            Manage all registered users in the system
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Users</CardTitle>
              <CardDescription className="text-base mt-1">
                Total users: <span className="font-bold text-primary">{users.length}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}
                        className={user.role === 'SUPER_ADMIN' 
                          ? 'bg-gradient-to-r from-primary to-secondary text-white font-semibold' 
                          : 'bg-muted text-muted-foreground font-semibold'}
                      >
                        {user.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '👤 User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.isActive ? 'default' : 'destructive'}
                        className={user.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 font-semibold' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200 font-semibold'}
                      >
                        {user.isActive ? '✓ Active' : '✕ Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={user.isActive ? 'destructive' : 'default'}
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        disabled={actionLoading === user.id}
                        className={user.isActive 
                          ? 'hover:shadow-lg transition-all' 
                          : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md transition-all'}
                      >
                        {actionLoading === user.id
                          ? 'Processing...'
                          : user.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
