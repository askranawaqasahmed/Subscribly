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
import { Plus, Eye, Edit, Trash2, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Subscription {
  id: string
  name: string
  icon: string | null
  description: string | null
  totalAmount: number
  totalMembers: number
  paymentType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner: {
    fullName: string
    email: string
  }
  members: Array<{
    id: string
    amount: number
    isActive: boolean
    subscriber: {
      fullName: string
      email: string
    }
  }>
}

type DrawerMode = 'view' | 'create' | 'edit' | null

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
    totalAmount: '',
    totalMembers: '',
    paymentType: 'equal',
  })

  useEffect(() => {
    fetchSubscriptions()
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

  const openDrawer = (mode: DrawerMode, subscription?: Subscription) => {
    setDrawerMode(mode)
    setSelectedSubscription(subscription || null)
    
    if (mode === 'edit' && subscription) {
      setFormData({
        name: subscription.name,
        icon: subscription.icon || '',
        description: subscription.description || '',
        totalAmount: subscription.totalAmount.toString(),
        totalMembers: subscription.totalMembers.toString(),
        paymentType: subscription.paymentType,
      })
    } else if (mode === 'create') {
      setFormData({
        name: '',
        icon: '',
        description: '',
        totalAmount: '',
        totalMembers: '',
        paymentType: 'equal',
      })
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
    
    try {
      const url = drawerMode === 'edit' && selectedSubscription
        ? `/api/subscriptions/${selectedSubscription.id}`
        : '/api/subscriptions'
      
      const response = await fetch(url, {
        method: drawerMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          totalMembers: parseInt(formData.totalMembers),
        }),
      })

      if (!response.ok) throw new Error('Failed to save subscription')

      toast.success(`Subscription ${drawerMode === 'edit' ? 'updated' : 'created'} successfully`)
      closeDrawer()
      fetchSubscriptions()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to save subscription')
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
                        <span className="text-2xl">{subscription.icon || '📦'}</span>
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
                      <Badge variant="secondary" className="font-semibold">
                        {subscription.members.length} / {subscription.totalMembers}
                      </Badge>
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
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
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

          {drawerMode === 'view' && selectedSubscription ? (
            // View Mode
            <div className="space-y-6 py-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                <span className="text-6xl">{selectedSubscription.icon || '📦'}</span>
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

              <div className="space-y-3">
                <Label className="text-lg font-bold">Members ({selectedSubscription.members.length})</Label>
                {selectedSubscription.members.map((member) => (
                  <div key={member.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{member.subscriber.fullName}</p>
                        <p className="text-sm text-muted-foreground">{member.subscriber.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">${member.amount.toFixed(2)}</p>
                        <Badge variant={member.isActive ? 'default' : 'secondary'} className="mt-1">
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
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
            // Create/Edit Mode
            <form onSubmit={handleSubmit} className="space-y-6 py-6">
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
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., 🎬"
                  maxLength={2}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalMembers">Total Members *</Label>
                  <Input
                    id="totalMembers"
                    type="number"
                    value={formData.totalMembers}
                    onChange={(e) => setFormData({ ...formData, totalMembers: e.target.value })}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
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

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary">
                  {drawerMode === 'edit' ? 'Update' : 'Create'} Subscription
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeDrawer}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
