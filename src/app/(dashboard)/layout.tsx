import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth?mode=login')
  }

  if (!user.onboardingComplete) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
