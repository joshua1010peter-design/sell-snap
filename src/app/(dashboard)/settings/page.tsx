import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { ChangePasswordForm } from '@/components/dashboard/change-password-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth?mode=login')

  return (
    <div>
      <Header title="Settings" description="Manage your account settings." />

      <div className="flex flex-col gap-6 max-w-2xl">
        <Card>
          <CardTitle>Profile</CardTitle>
          <CardContent>
            <SettingsForm user={{ name: user.name, email: user.email, businessName: user.businessName ?? '' }} />
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Change Password</CardTitle>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
