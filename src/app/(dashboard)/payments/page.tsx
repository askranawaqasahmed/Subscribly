import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Payment management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
