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
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabs for filtering */}
          <Tabs value={filterTab} onValueChange={(value) => setFilterTab(value as any)} className="w-full">
            <div className="px-6 pt-6 pb-4 border-b">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all">
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="generated">
                  Generated ({stats.generated})
                </TabsTrigger>
                <TabsTrigger value="sent">
                  Sent ({stats.sent})
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Paid ({stats.paid})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={filterTab} className="m-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Invoice #</TableHead>
                    <TableHead className="font-bold">Subscription</TableHead>
                    <TableHead className="font-bold">Recipient</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Months</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Created</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <span className="font-mono font-semibold text-primary">
                            #{invoice.invoiceNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{invoice.subscription.icon || '📦'}</span>
                            <span className="font-semibold">{invoice.subscription.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.recipient.fullName}</p>
                            <p className="text-sm text-muted-foreground">{invoice.recipient.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-bold text-primary">
                            ${invoice.totalAmount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground font-mono">{invoice.monthsCovered}</p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDrawer(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invoice.status === 'generated' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleSendInvoice(invoice.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {invoice.status === 'sent' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleMarkAsPaid(invoice.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Right-to-Left Sliding Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">Invoice Details</SheetTitle>
            <SheetDescription>
              View invoice information and manage status
            </SheetDescription>
          </SheetHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-6">
              {/* Invoice Header */}
              <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border-2 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <h3 className="text-3xl font-bold font-mono text-primary">
                      #{selectedInvoice.invoiceNumber}
                    </h3>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t border-primary/20">
                  <span className="text-4xl">{selectedInvoice.subscription.icon || '📦'}</span>
                  <div>
                    <h4 className="text-xl font-bold">{selectedInvoice.subscription.name}</h4>
                    <p className="text-sm text-muted-foreground">Subscription</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <Label className="text-muted-foreground text-sm">Total Amount</Label>
                <p className="text-4xl font-bold text-green-700 mt-2">
                  ${selectedInvoice.totalAmount.toFixed(2)}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-muted-foreground text-sm">Months Covered</Label>
                  <p className="font-semibold text-lg mt-1 font-mono">
                    {selectedInvoice.monthsCovered}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label className="text-muted-foreground text-sm">Created On</Label>
                  <p className="font-semibold text-lg mt-1">
                    {format(new Date(selectedInvoice.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {/* Recipient */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <Label className="text-muted-foreground text-sm">Recipient</Label>
                <p className="font-semibold text-lg mt-1">{selectedInvoice.recipient.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.recipient.email}</p>
              </div>

              {/* Owner */}
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground text-sm">Subscription Owner</Label>
                <p className="font-semibold text-lg mt-1">{selectedInvoice.subscription.owner.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.subscription.owner.email}</p>
              </div>

              {/* Created By */}
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground text-sm">Created By</Label>
                <p className="font-semibold mt-1">{selectedInvoice.creator.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.creator.email}</p>
              </div>

              {/* Timeline */}
              {(selectedInvoice.sentOn || selectedInvoice.paidOn) && (
                <div className="space-y-3">
                  <Label className="text-lg font-bold">Timeline</Label>
                  {selectedInvoice.sentOn && (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <Label className="text-muted-foreground text-sm">Sent On</Label>
                      <p className="font-semibold mt-1">
                        {format(new Date(selectedInvoice.sentOn), 'MMMM dd, yyyy, h:mm a')}
                      </p>
                    </div>
                  )}
                  {selectedInvoice.paidOn && (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <Label className="text-muted-foreground text-sm">Paid On</Label>
                      <p className="font-semibold mt-1 text-green-700">
                        {format(new Date(selectedInvoice.paidOn), 'MMMM dd, yyyy, h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4">
                {selectedInvoice.status === 'generated' && (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600" 
                    onClick={() => handleSendInvoice(selectedInvoice.id)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice via Email
                  </Button>
                )}
                {selectedInvoice.status === 'sent' && (
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-green-600" 
                    onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={closeDrawer}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
