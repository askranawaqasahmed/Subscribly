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
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Eye, FileText, Send, CheckCircle, Download, Plus, Mail, Loader2, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { API_ROUTES } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  monthsCovered: string
  status: string
  sentOn: string | null
  paidOn: string | null
  createdAt: string
  subscription: {
    id: string
    name: string
    icon: string | null
    owner: {
      fullName: string
      email: string
    }
  }
  recipient: {
    id: string
    fullName: string
    email: string
  }
  creator: {
    fullName: string
    email: string
  }
}

interface UserWithUnpaid {
  id: string
  fullName: string
  email: string
  unpaidCount: number
  unpaidAmount: number
  subscriptions: string[]
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [filterTab, setFilterTab] = useState<'all' | 'generated' | 'sent' | 'paid'>('all')
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generatingAndEmailing, setGeneratingAndEmailing] = useState(false)
  const [showUsersDialog, setShowUsersDialog] = useState(false)
  const [usersWithUnpaid, setUsersWithUnpaid] = useState<UserWithUnpaid[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [generatingForUser, setGeneratingForUser] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (!response.ok) throw new Error('Failed to fetch invoices')
      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const openDrawer = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedInvoice(null)
  }

  const handleSendInvoice = async (invoiceId: string) => {
    if (!confirm('Send this invoice via email?')) return

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to send invoice')

      toast.success('Invoice sent successfully')
      fetchInvoices()
      closeDrawer()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to send invoice')
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!confirm('Mark this invoice as paid?')) return

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to mark invoice as paid')

      toast.success('Invoice marked as paid successfully')
      fetchInvoices()
      closeDrawer()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to mark invoice as paid')
    }
  }

  const handleGenerateAll = async (sendEmail: boolean) => {
    if (!confirm(`Generate invoices for all users with unpaid payments${sendEmail ? ' and send them via email' : ''}?`)) return

    if (sendEmail) {
      setGeneratingAndEmailing(true)
    } else {
      setGeneratingAll(true)
    }

    try {
      const response = await fetch(API_ROUTES.GENERATE_ALL_INVOICES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to generate invoices')

      if (sendEmail) {
        toast.success(`Generated ${data.count} invoices, ${data.emailedCount} emailed successfully`)
      } else {
        toast.success(data.message || `Generated ${data.count} invoices successfully`)
      }
      
      fetchInvoices()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate invoices')
    } finally {
      setGeneratingAll(false)
      setGeneratingAndEmailing(false)
    }
  }

  const fetchUsersWithUnpaid = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch(API_ROUTES.USERS_WITH_UNPAID)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to fetch users')

      setUsersWithUnpaid(data.users || [])
      setShowUsersDialog(true)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load users with unpaid payments')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleGenerateForUser = async (userId: string, sendEmail: boolean) => {
    setGeneratingForUser(userId)
    
    try {
      const response = await fetch(API_ROUTES.GENERATE_INVOICE_FOR_USER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sendEmail }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to generate invoice')

      toast.success(data.message || 'Invoice generated successfully')
      fetchInvoices()
      setShowUsersDialog(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate invoice')
    } finally {
      setGeneratingForUser(null)
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (filterTab === 'generated') return invoice.status === 'generated'
    if (filterTab === 'sent') return invoice.status === 'sent'
    if (filterTab === 'paid') return invoice.status === 'paid'
    return true
  })

  const stats = {
    total: invoices.length,
    generated: invoices.filter(i => i.status === 'generated').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold">📄 Generated</Badge>
      case 'sent':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold">📧 Sent</Badge>
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 font-semibold">✓ Paid</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading invoices...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Invoices</h1>
          </div>
          <p className="text-white/90 text-lg mb-6">
            Manage and track all invoices
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Total</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Generated</p>
              <p className="text-3xl font-bold text-white">{stats.generated}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Sent</p>
              <p className="text-3xl font-bold text-white">{stats.sent}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Paid</p>
              <p className="text-3xl font-bold text-white">{stats.paid}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={fetchUsersWithUnpaid}
              variant="secondary"
              size="lg"
              disabled={loadingUsers}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {loadingUsers ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Generate for User
            </Button>
            <Button
              onClick={() => handleGenerateAll(false)}
              variant="secondary"
              size="lg"
              disabled={generatingAll || generatingAndEmailing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {generatingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate All Invoices
            </Button>
            <Button
              onClick={() => handleGenerateAll(true)}
              variant="secondary"
              size="lg"
              disabled={generatingAll || generatingAndEmailing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {generatingAndEmailing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Generate & Email All
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Users with Unpaid Payments Dialog */}
      <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Invoice for User</DialogTitle>
            <DialogDescription>
              Select a user to generate an invoice for their unpaid payments
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {usersWithUnpaid.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No users with unpaid payments found
              </p>
            ) : (
              usersWithUnpaid.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{user.fullName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {user.unpaidCount} unpaid payment{user.unpaidCount !== 1 ? 's' : ''} • 
                      ${user.unpaidAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Subscriptions: {user.subscriptions.join(', ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateForUser(user.id, false)}
                      variant="outline"
                      size="sm"
                      disabled={generatingForUser === user.id}
                    >
                      {generatingForUser === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Generate'
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerateForUser(user.id, true)}
                      size="sm"
                      disabled={generatingForUser === user.id}
                    >
                      {generatingForUser === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-1" />
                          Generate & Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoices Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Invoices</CardTitle>
              <CardDescription className="text-base mt-1">
                Total: <span className="font-bold text-primary">{filteredInvoices.length}</span>
              </CardDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoices Table */}
