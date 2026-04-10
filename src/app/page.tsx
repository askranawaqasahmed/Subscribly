import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ROUTES } from '@/lib/constants'

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect(ROUTES.DASHBOARD)
  } else {
    redirect(ROUTES.LOGIN)
  }
}
