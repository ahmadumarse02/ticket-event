"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Aperture, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { hasAdminRole } from "@/lib/auth-utils"
import { ThemeToggle } from "@/components/public/theme-toggle"

export function SiteHeader() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  const isAdmin = hasAdminRole(role)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
            <Aperture className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Aurora</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/" className="transition hover:text-foreground">
            Home
          </Link>
          <Link href="/events" className="transition hover:text-foreground">
            Events
          </Link>
          <Link href="/about" className="transition hover:text-foreground">
            About
          </Link>
          <Link href="/faq" className="transition hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <>
              {isAdmin ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" className="gradient-bg hover:opacity-90" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
 