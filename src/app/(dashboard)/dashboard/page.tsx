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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-8 shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
              Welcome Back! 👋
            </h1>
            <p className="text-white/90 text-lg">
              Manage your subscriptions and track payments
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
            <Link href={ROUTES.SUBSCRIPTION_NEW}>
              <Plus className="mr-2 h-5 w-5" />
              New Subscription
            </Link>
          </Button>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      <Tabs defaultValue="my-subscriptions" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-xl shadow-sm">
          <TabsTrigger 
            value="my-subscriptions" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md px-6"
          >
            <span className="font-semibold">My Subscriptions</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {mySubscriptions?.length || 0}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="subscribed"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md px-6"
          >
            <span className="font-semibold">Subscribed To</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
              {subscribedSubscriptions?.length || 0}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-subscriptions" className="space-y-4">
          {mySubscriptions && mySubscriptions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mySubscriptions.map((subscription: any) => (
                <Card key={subscription.id} className="card-hover border-0 shadow-lg bg-gradient-to-br from-white to-muted/30 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-3xl p-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                        {subscription.icon || '📦'}
                      </span>
                      <span className="gradient-text font-bold">{subscription.name}</span>
                    </CardTitle>
                    <CardDescription className="text-base font-medium">
                      <span className="text-2xl font-bold text-primary">${subscription.total_amount.toFixed(2)}</span>
                      <span className="text-muted-foreground">/month</span>
                      <span className="mx-2">•</span>
                      <span className="text-muted-foreground">{subscription.member_count} members</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {subscription.total_pending > 0 && (
                        <div className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg font-semibold">
                          <span className="text-lg">⚠️</span>
                          ${subscription.total_pending.toFixed(2)} pending
                        </div>
                      )}
                      <Button asChild variant="default" size="sm" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md">
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
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-6 text-lg">
                  You haven&apos;t created any subscriptions yet
                </p>
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subscribedSubscriptions.map((subscription: any) => (
                <Card key={subscription.id} className="card-hover border-0 shadow-lg bg-gradient-to-br from-white to-muted/30 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/5 to-transparent rounded-full -mr-16 -mt-16" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-3xl p-3 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl">
                        {subscription.icon || '📦'}
                      </span>
                      <span className="gradient-text font-bold">{subscription.name}</span>
                    </CardTitle>
                    <CardDescription className="text-base font-medium space-y-1">
                      <div>
                        <span className="text-2xl font-bold text-secondary">${subscription.my_amount.toFixed(2)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Owner:</span> <span className="font-semibold text-foreground">{subscription.owner_name}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm ${
                        subscription.is_paid 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        <span className="text-lg">{subscription.is_paid ? '✓' : '⏱️'}</span>
                        {subscription.is_paid ? 'Paid' : 'Payment Due'}
                      </div>
                      <Button asChild variant="default" size="sm" className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 shadow-md">
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
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-muted-foreground text-lg">
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
