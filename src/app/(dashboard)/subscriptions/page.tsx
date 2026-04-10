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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Eye, Edit, Trash2, Users, UserPlus, UserMinus } from 'lucide-react'
import { format } from 'date-fns'
import { UserMultiSelect } from '@/components/ui/user-multi-select'
import { MemberAmountInput } from '@/components/subscriptions/member-amount-input'
import { MemberAvatars } from '@/components/subscriptions/member-avatars'

interface SubscriptionType {
  id: string
  name: string
  icon: string | null
  description: string | null
}

interface User {
  id: string
  fullName: string
  email: string
}

interface Subscription {
  id: string
  name: string
  description: string | null
  totalAmount: number
  totalMembers: number
  paymentType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  subscriptionType?: {
    id: string
    name: string
    icon: string | null
  } | null
  owner: {
    fullName: string
    email: string
  }
  members: Array<{
    id: string
    amount: number
    isActive: boolean
    subscriber: {
      id: string
      fullName: string
      email: string
    }
  }>
}

type DrawerMode = 'view' | 'create' | 'edit' | null

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalAmount: '',
    paymentType: 'equal',
    subscriptionTypeId: '',
    selectedUserIds: [] as string[],
    memberAmounts: {} as Record<string, number>,
  })

  useEffect(() => {
    fetchSubscriptions()
    fetchSubscriptionTypes()
    fetchAvailableUsers()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      if (!response.ok) throw new Error('Failed to fetch subscriptions')
      const data = await response.json()
      setSubscriptions(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionTypes = async () => {
    try {
      const response = await fetch('/api/subscription-types')
      if (!response.ok) throw new Error('Failed to fetch subscription types')
      const data = await response.json()
      setSubscriptionTypes(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load subscription types')
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setAvailableUsers(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load users')
    }
  }

  const handleTypeSelect = (typeId: string) => {
    setSelectedTypeId(typeId)
    const type = subscriptionTypes.find(t => t.id === typeId)
    if (type) {
      setFormData({
        ...formData,
        name: type.name,
        description: type.description || '',
        subscriptionTypeId: typeId,
      })
    }
  }

  const openDrawer = (mode: DrawerMode, subscription?: Subscription) => {
    setDrawerMode(mode)
    setSelectedSubscription(subscription || null)
    
    if (mode === 'edit' && subscription) {
      const memberIds = subscription.members.filter(m => m.isActive).map(m => m.subscriber.id)
      const amounts: Record<string, number> = {}
      subscription.members.filter(m => m.isActive).forEach(m => {
        amounts[m.subscriber.id] = m.amount
      })
      
      setFormData({
        name: subscription.name,
        description: subscription.description || '',
        totalAmount: subscription.totalAmount.toString(),
        paymentType: subscription.paymentType,
        subscriptionTypeId: '',
        selectedUserIds: memberIds,
        memberAmounts: amounts,
      })
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        totalAmount: '',
        paymentType: 'equal',
        subscriptionTypeId: '',
        selectedUserIds: [],
        memberAmounts: {},
      })
      setSelectedTypeId('')
    }
    
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerMode(null)
    setSelectedSubscription(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.selectedUserIds.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      toast.error('Please enter a valid total amount')
      return
    }

    if (formData.paymentType === 'individual') {
      // Check if all members have amounts
      for (const userId of formData.selectedUserIds) {
        if (!formData.memberAmounts[userId] || formData.memberAmounts[userId] <= 0) {
          toast.error('Please enter amount for all members')
          return
        }
      }

      // Check if individual amounts exceed the total
      const individualTotal = formData.selectedUserIds.reduce(
        (sum, userId) => sum + (formData.memberAmounts[userId] || 0), 
        0
      )
      const maxTotal = parseFloat(formData.totalAmount)
      
      if (individualTotal > maxTotal) {
        toast.error(`Individual amounts ($${individualTotal.toFixed(2)}) cannot exceed total amount ($${maxTotal.toFixed(2)})`)
        return
      }
    }
    
    try {
      const url = drawerMode === 'edit' && selectedSubscription
        ? `/api/subscriptions/${selectedSubscription.id}`
        : '/api/subscriptions'
      
      const totalAmount = parseFloat(formData.totalAmount)
      
      const response = await fetch(url, {
        method: drawerMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          totalAmount: totalAmount,
          totalMembers: formData.selectedUserIds.length,
          paymentType: formData.paymentType,
          subscriptionTypeId: formData.subscriptionTypeId || null,
          memberUserIds: formData.selectedUserIds,
          memberAmounts: formData.memberAmounts,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save subscription')
      }

      toast.success(`Subscription ${drawerMode === 'edit' ? 'updated' : 'created'} successfully`)
      closeDrawer()
      fetchSubscriptions()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to save subscription')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete subscription')

      toast.success('Subscription deleted successfully')
      fetchSubscriptions()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to delete subscription')
    }
  }

  const handleAddMember = async (userId: string, amount: string) => {
    if (!selectedSubscription) return

    try {
      const response = await fetch(`/api/subscriptions/${selectedSubscription.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: parseFloat(amount) }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add member')
      }

      toast.success('Member added successfully')
      fetchSubscriptions()
      // Refresh the selected subscription
      const updatedSubs = await fetch('/api/subscriptions').then(r => r.json())
      const updated = updatedSubs.find((s: Subscription) => s.id === selectedSubscription.id)
      if (updated) setSelectedSubscription(updated)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!selectedSubscription) return
    
    if (!confirm(`Are you sure you want to remove ${memberName} from this subscription?`)) return

    try {
      const response = await fetch(`/api/subscriptions/${selectedSubscription.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove member')

      toast.success('Member removed successfully')
      fetchSubscriptions()
      // Refresh the selected subscription
      const updatedSubs = await fetch('/api/subscriptions').then(r => r.json())
      const updated = updatedSubs.find((s: Subscription) => s.id === selectedSubscription.id)
      if (updated) setSelectedSubscription(updated)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to remove member')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading subscriptions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-8 shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Subscriptions</h1>
            </div>
            <p className="text-white/90 text-lg">
              Manage all shared subscriptions
            </p>
          </div>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-lg"
            onClick={() => openDrawer('create')}
          >
            <Plus className="mr-2 h-5 w-5" />
            New Subscription
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Subscriptions Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Subscriptions</CardTitle>
              <CardDescription className="text-base mt-1">
                Total: <span className="font-bold text-primary">{subscriptions.length}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Owner</TableHead>
                <TableHead className="font-bold">Amount</TableHead>
                <TableHead className="font-bold">Members</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No subscriptions found. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{subscription.subscriptionType?.icon || '📦'}</span>
                        <div>
                          <p className="font-semibold">{subscription.name}</p>
                          {subscription.description && (
                            <p className="text-sm text-muted-foreground">{subscription.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subscription.owner.fullName}</p>
                        <p className="text-sm text-muted-foreground">{subscription.owner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-primary">
                        ${subscription.totalAmount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <MemberAvatars members={subscription.members} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {subscription.paymentType === 'equal' ? 'Equal Split' : 'Individual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={subscription.isActive ? 'default' : 'destructive'}
                        className={subscription.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'}
                      >
                        {subscription.isActive ? '✓ Active' : '✕ Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDrawer('view', subscription)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDrawer('edit', subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(subscription.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Right-to-Left Sliding Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <div className="px-6 pt-6">
            <SheetHeader>
              <SheetTitle className="text-2xl">
                {drawerMode === 'view' && 'Subscription Details'}
                {drawerMode === 'create' && 'Create Subscription'}
                {drawerMode === 'edit' && 'Edit Subscription'}
              </SheetTitle>
              <SheetDescription>
                {drawerMode === 'view' && 'View subscription information and members'}
                {drawerMode === 'create' && 'Add a new subscription to the system'}
                {drawerMode === 'edit' && 'Update subscription details'}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            {drawerMode === 'view' && selectedSubscription ? (
              // View Mode
              <div className="space-y-6 py-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                <span className="text-6xl">{selectedSubscription.subscriptionType?.icon || '📦'}</span>
                <div>
                  <h3 className="text-2xl font-bold">{selectedSubscription.name}</h3>
                  <p className="text-muted-foreground">{selectedSubscription.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="text-2xl font-bold text-primary">
                    ${selectedSubscription.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Payment Type</Label>
                  <Badge variant="outline" className="text-sm">
                    {selectedSubscription.paymentType === 'equal' ? 'Equal Split' : 'Individual'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Total Members</Label>
                  <p className="text-xl font-bold">{selectedSubscription.totalMembers}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedSubscription.isActive ? 'default' : 'destructive'}>
                    {selectedSubscription.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Owner</Label>
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold">{selectedSubscription.owner.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedSubscription.owner.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">
                    Members ({selectedSubscription.members.filter(m => m.isActive).length})
                  </Label>
                </div>

                {/* Current Members */}
                <div className="space-y-2">
                  {selectedSubscription.members.filter(m => m.isActive).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                      No members added yet
                    </p>
                  ) : (
                    selectedSubscription.members
                      .filter(m => m.isActive)
                      .map((member) => (
                        <div key={member.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{member.subscriber.fullName}</p>
                              <p className="text-sm text-muted-foreground">{member.subscriber.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">${member.amount.toFixed(2)}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveMember(member.id, member.subscriber.fullName)}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Add New Member Form */}
                <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
                  <Label className="text-sm font-bold mb-2 block">Add New Member</Label>
                  <div className="space-y-3">
                    <Select
                      onValueChange={(value) => {
                        const select = document.getElementById('new-member-user') as HTMLSelectElement
                        if (select) select.value = value
                      }}
                    >
                      <SelectTrigger id="new-member-user">
                        <SelectValue placeholder="Select a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers
                          .filter(user => 
                            !selectedSubscription.members.some(m => 
                              m.subscriber.id === user.id && m.isActive
                            )
                          )
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName} ({user.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        id="new-member-amount"
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const userSelect = document.getElementById('new-member-user') as HTMLSelectElement
                          const amountInput = document.getElementById('new-member-amount') as HTMLInputElement
                          if (userSelect?.value && amountInput?.value) {
                            handleAddMember(userSelect.value, amountInput.value)
                            amountInput.value = ''
                          }
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Create/Edit Mode
            <form id="subscription-form" onSubmit={handleSubmit} className="space-y-6 py-6">
              {drawerMode === 'create' && (
                <div className="space-y-2 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border-2 border-primary/20">
                  <Label htmlFor="subscriptionType" className="text-base font-bold">
                    Select Subscription Type (Optional)
                  </Label>
                  <Select
                    value={selectedTypeId}
                    onValueChange={handleTypeSelect}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose a subscription type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Custom (Enter manually)</SelectItem>
                      {subscriptionTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecting a type will auto-fill the form with default values
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Subscription Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Netflix Premium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the subscription"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value) => {
                    const newPaymentType = value as 'equal' | 'individual'
                    if (newPaymentType === 'individual' && formData.paymentType === 'equal') {
                      // Switching to individual: initialize amounts with equal split
                      const equalAmount = formData.totalAmount ? parseFloat(formData.totalAmount) / formData.selectedUserIds.length : 0
                      const newAmounts: Record<string, number> = {}
                      formData.selectedUserIds.forEach(userId => {
                        newAmounts[userId] = equalAmount
                      })
                      setFormData({ ...formData, paymentType: newPaymentType, memberAmounts: newAmounts })
                    } else if (newPaymentType === 'equal' && formData.paymentType === 'individual') {
                      // Switching to equal: keep totalAmount as is
                      setFormData({ ...formData, paymentType: newPaymentType })
                    } else {
                      setFormData({ ...formData, paymentType: newPaymentType })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal Split</SelectItem>
                    <SelectItem value="individual">Individual Amounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, totalAmount: e.target.value })
                  }}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Members * ({formData.selectedUserIds.length} selected)</Label>
                </div>
                <UserMultiSelect
                  users={availableUsers}
                  selectedUserIds={formData.selectedUserIds}
                  onChange={(selectedIds) => {
                    // When adding new users, initialize their amounts for individual type
                    if (formData.paymentType === 'individual') {
                      const newAmounts = { ...formData.memberAmounts }
                      const equalAmount = formData.totalAmount 
                        ? parseFloat(formData.totalAmount) / selectedIds.length 
                        : 0
                      
                      selectedIds.forEach(userId => {
                        if (!newAmounts[userId]) {
                          newAmounts[userId] = equalAmount
                        }
                      })
                      
                      setFormData({ 
                        ...formData, 
                        selectedUserIds: selectedIds,
                        memberAmounts: newAmounts 
                      })
                    } else {
                      setFormData({ ...formData, selectedUserIds: selectedIds })
                    }
                  }}
                />
              </div>

              {formData.selectedUserIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Member Amounts</Label>
                  <MemberAmountInput
                    users={availableUsers}
                    selectedUserIds={formData.selectedUserIds}
                    memberAmounts={formData.memberAmounts}
                    paymentType={formData.paymentType}
                    totalAmount={formData.totalAmount}
                    onAmountChange={(userId, amount) => {
                      setFormData({
                        ...formData,
                        memberAmounts: {
                          ...formData.memberAmounts,
                          [userId]: amount,
                        },
                      })
                    }}
                    onRemoveUser={(userId) => {
                      const newSelectedIds = formData.selectedUserIds.filter(id => id !== userId)
                      const newAmounts = { ...formData.memberAmounts }
                      delete newAmounts[userId]
                      setFormData({
                        ...formData,
                        selectedUserIds: newSelectedIds,
                        memberAmounts: newAmounts,
                      })
                    }}
                  />
                </div>
              )}
            </form>
          )}
          </div>

          {/* Fixed Footer - Conditional based on mode */}
          {drawerMode === 'view' && selectedSubscription ? (
            <div className="border-t p-4 bg-background">
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    closeDrawer()
                    setTimeout(() => openDrawer('edit', selectedSubscription), 300)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeDrawer}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t p-4 bg-background">
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  form="subscription-form"
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  {drawerMode === 'edit' ? 'Update' : 'Create'} Subscription
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={closeDrawer}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
