import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export default function SubscriptionsPage() {
  // Redirect to dashboard which already shows subscriptions
  redirect(ROUTES.DASHBOARD)
}
