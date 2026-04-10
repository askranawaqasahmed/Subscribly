import { auth } from '@/lib/auth'
import { SubscriptionService } from '@/lib/services/subscription-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const service = new SubscriptionService()
  const mySubscriptions = await service.getMySubscriptions(session.user.id)
  const subscribedSubscriptions = await service.getSubscribedSubscriptions(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your subscriptions and track payments
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.SUBSCRIPTION_NEW}>
            <Plus className="mr-2 h-4 w-4" />
            New Subscription
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="my-subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-subscriptions">
            My Subscriptions ({mySubscriptions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="subscribed">
            Subscribed To ({subscribedSubscriptions?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-subscriptions" className="space-y-4">
          {mySubscriptions && mySubscriptions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mySubscriptions.map((subscription: any) => (
                <Card key={subscription.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{subscription.icon || '📦'}</span>
                      {subscription.name}
                    </CardTitle>
                    <CardDescription>
                      ${subscription.total_amount.toFixed(2)}/month • {subscription.member_count} members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {subscription.total_pending > 0 && (
                        <div className="text-sm text-red-600">
                          ${subscription.total_pending.toFixed(2)} pending
                        </div>
                      )}
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={ROUTES.SUBSCRIPTION_DETAIL(subscription.id)}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t created any subscriptions yet
                </p>
                <Button asChild>
                  <Link href={ROUTES.SUBSCRIPTION_NEW}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Subscription
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscribed" className="space-y-4">
          {subscribedSubscriptions && subscribedSubscriptions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subscribedSubscriptions.map((subscription: any) => (
                <Card key={subscription.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{subscription.icon || '📦'}</span>
                      {subscription.name}
                    </CardTitle>
                    <CardDescription>
                      ${subscription.my_amount.toFixed(2)}/month • Owner: {subscription.owner_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={`text-sm ${subscription.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                        {subscription.is_paid ? '✓ Paid' : '⚠ Payment Due'}
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={ROUTES.SUBSCRIPTION_DETAIL(subscription.id)}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  You aren&apos;t a member of any subscriptions yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
