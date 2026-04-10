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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, Eye, Edit, DollarSign, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Payment {
  id: string
  amount: number
  isPaid: boolean
  paidOn: string | null
  expiryDate: string
  createdAt: string
  subscription: {
    id: string
    name: string
    icon: string | null
  }
  member: {
    id: string
    fullName: string
    email: string
  }
  creator: {
    fullName: string
    email: string
  }
}

type DrawerMode = 'view' | null

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [filterTab, setFilterTab] = useState<'all' | 'paid' | 'unpaid'>('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (!response.ok) throw new Error('Failed to fetch payments')
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const openDrawer = (payment: Payment) => {
    setDrawerMode('view')
    setSelectedPayment(payment)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerMode(null)
    setSelectedPayment(null)
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    if (!confirm('Mark this payment as paid?')) return

    try {
      const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to mark payment as paid')

      toast.success('Payment marked as paid successfully')
      fetchPayments()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to mark payment as paid')
    }
  }

  const filteredPayments = payments.filter((payment) => {
    if (filterTab === 'paid') return payment.isPaid
    if (filterTab === 'unpaid') return !payment.isPaid
    return true
  })

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.isPaid).length,
    unpaid: payments.filter(p => !p.isPaid).length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0),
    unpaidAmount: payments.filter(p => !p.isPaid).reduce((sum, p) => sum + p.amount, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading payments...</p>
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
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Payments</h1>
          </div>
          <p className="text-white/90 text-lg mb-6">
            Track all payment transactions
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Total Payments</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Paid Amount</p>
              <p className="text-3xl font-bold text-white">${stats.paidAmount.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Pending Amount</p>
              <p className="text-3xl font-bold text-white">${stats.unpaidAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Payments Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Payments</CardTitle>
              <CardDescription className="text-base mt-1">
                Total: <span className="font-bold text-primary">{filteredPayments.length}</span>
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
                <TabsTrigger value="paid">
                  Paid ({stats.paid})
                </TabsTrigger>
                <TabsTrigger value="unpaid">
                  Unpaid ({stats.unpaid})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={filterTab} className="m-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Subscription</TableHead>
                    <TableHead className="font-bold">Member</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Due Date</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Paid On</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{payment.subscription.icon || '📦'}</span>
                            <span className="font-semibold">{payment.subscription.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.member.fullName}</p>
                            <p className="text-sm text-muted-foreground">{payment.member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-bold text-primary">
                            ${payment.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(payment.expiryDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={payment.isPaid ? 'default' : 'destructive'}
                            className={payment.isPaid 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 font-semibold' 
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold'}
                          >
                            {payment.isPaid ? '✓ Paid' : '⏱️ Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.paidOn ? format(new Date(payment.paidOn), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDrawer(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!payment.isPaid && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleMarkAsPaid(payment.id)}
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
            <SheetTitle className="text-2xl">Payment Details</SheetTitle>
            <SheetDescription>
              View payment transaction information
            </SheetDescription>
          </SheetHeader>

          {selectedPayment && (
            <div className="space-y-6 py-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                <span className="text-6xl">{selectedPayment.subscription.icon || '📦'}</span>
                <div>
                  <h3 className="text-2xl font-bold">{selectedPayment.subscription.name}</h3>
                  <p className="text-muted-foreground">Payment Transaction</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-3xl font-bold text-primary">
                    ${selectedPayment.amount.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge 
                    variant={selectedPayment.isPaid ? 'default' : 'destructive'}
                    className={selectedPayment.isPaid 
                      ? 'bg-green-100 text-green-700 text-base px-3 py-1' 
                      : 'bg-amber-100 text-amber-700 text-base px-3 py-1'}
                  >
                    {selectedPayment.isPaid ? '✓ Paid' : '⏱️ Unpaid'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-muted-foreground text-sm">Member</Label>
                  <p className="font-semibold text-lg mt-1">{selectedPayment.member.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.member.email}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <Label className="text-muted-foreground text-sm">Due Date</Label>
                  <p className="font-semibold text-lg mt-1">
                    {format(new Date(selectedPayment.expiryDate), 'MMMM dd, yyyy')}
                  </p>
                </div>

                {selectedPayment.paidOn && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <Label className="text-muted-foreground text-sm">Paid On</Label>
                    <p className="font-semibold text-lg mt-1 text-green-700">
                      {format(new Date(selectedPayment.paidOn), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                )}

                <div className="p-4 border rounded-lg">
                  <Label className="text-muted-foreground text-sm">Created By</Label>
                  <p className="font-semibold mt-1">{selectedPayment.creator.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.creator.email}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <Label className="text-muted-foreground text-sm">Created On</Label>
                  <p className="font-semibold mt-1">
                    {format(new Date(selectedPayment.createdAt), 'MMMM dd, yyyy, h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {!selectedPayment.isPaid && (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600" 
                    onClick={() => {
                      handleMarkAsPaid(selectedPayment.id)
                      closeDrawer()
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1"
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
