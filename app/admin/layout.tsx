import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { auth } from "@/lib/auth"
import { hasAdminRole } from "@/lib/auth-utils"

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const role = (session.user as { role?: string | string[] | null }).role
  if (!hasAdminRole(role)) {
    redirect("/events")
  }

  return <AdminLayout>{children}</AdminLayout>
}
