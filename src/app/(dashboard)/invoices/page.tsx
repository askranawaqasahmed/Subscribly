import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Invoices</h1>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Invoice management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
