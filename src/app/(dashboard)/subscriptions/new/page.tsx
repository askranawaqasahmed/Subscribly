import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewSubscriptionPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Create Subscription</h1>
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Subscription creation form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
