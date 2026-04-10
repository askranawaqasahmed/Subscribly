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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Eye, Edit, Trash2, Tags } from 'lucide-react'
import { format } from 'date-fns'

interface SubscriptionType {
  id: string
  name: string
  icon: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type DrawerMode = 'view' | 'create' | 'edit' | null

export default function SubscriptionTypesPage() {
  const [types, setTypes] = useState<SubscriptionType[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedType, setSelectedType] = useState<SubscriptionType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
  })

  useEffect(() => {
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    try {
      const response = await fetch('/api/admin/subscription-types')
      if (!response.ok) throw new Error('Failed to fetch subscription types')
      const data = await response.json()
      setTypes(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load subscription types')
    } finally {
      setLoading(false)
    }
  }

  const openDrawer = (mode: DrawerMode, type?: SubscriptionType) => {
    setDrawerMode(mode)
    setSelectedType(type || null)
    
    if (mode === 'edit' && type) {
      setFormData({
        name: type.name,
        icon: type.icon || '',
        description: type.description || '',
      })
    } else if (mode === 'create') {
      setFormData({
        name: '',
        icon: '',
        description: '',
      })
    }
    
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerMode(null)
    setSelectedType(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = drawerMode === 'edit' && selectedType
        ? `/api/admin/subscription-types/${selectedType.id}`
        : '/api/admin/subscription-types'
      
      const response = await fetch(url, {
        method: drawerMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save subscription type')

      toast.success(`Subscription type ${drawerMode === 'edit' ? 'updated' : 'created'} successfully`)
      closeDrawer()
      fetchTypes()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to save subscription type')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this subscription type?')) return

    try {
      const response = await fetch(`/api/admin/subscription-types/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete subscription type')

      toast.success('Subscription type deactivated successfully')
      fetchTypes()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to delete subscription type')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading subscription types...</p>
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
                <Tags className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Subscription Types</h1>
            </div>
            <p className="text-white/90 text-lg">
              Manage subscription templates and categories
            </p>
          </div>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-lg"
            onClick={() => openDrawer('create')}
          >
            <Plus className="mr-2 h-5 w-5" />
            New Type
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Types Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Subscription Types</CardTitle>
              <CardDescription className="text-base mt-1">
                Total: <span className="font-bold text-primary">{types.length}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Description</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Created</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No subscription types found. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{type.icon || '📦'}</span>
                        <span className="font-semibold">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {type.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={type.isActive ? 'default' : 'destructive'}
                        className={type.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'}
                      >
                        {type.isActive ? '✓ Active' : '✕ Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(type.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDrawer('view', type)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDrawer('edit', type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {type.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
              {drawerMode === 'view' && 'Subscription Type Details'}
              {drawerMode === 'create' && 'Create Subscription Type'}
              {drawerMode === 'edit' && 'Edit Subscription Type'}
            </SheetTitle>
            <SheetDescription>
              {drawerMode === 'view' && 'View subscription type information'}
              {drawerMode === 'create' && 'Add a new subscription type template'}
              {drawerMode === 'edit' && 'Update subscription type details'}
            </SheetDescription>
          </SheetHeader>

          {drawerMode === 'view' && selectedType ? (
            // View Mode
            <div className="space-y-6 py-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                <span className="text-6xl">{selectedType.icon || '📦'}</span>
                <div>
                  <h3 className="text-2xl font-bold">{selectedType.name}</h3>
                  <p className="text-muted-foreground">{selectedType.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedType.isActive ? 'default' : 'destructive'}>
                    {selectedType.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{format(new Date(selectedType.createdAt), 'PPP')}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    closeDrawer()
                    setTimeout(() => openDrawer('edit', selectedType), 300)
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
                <Label htmlFor="name">Name *</Label>
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
                  placeholder="Brief description of the subscription type"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary">
                  {drawerMode === 'edit' ? 'Update' : 'Create'} Type
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
