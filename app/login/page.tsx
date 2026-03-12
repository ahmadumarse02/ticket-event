"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Aperture, Lock, Mail } from "lucide-react"
import { SiteHeader } from "@/components/public/site-header"
import { SiteFooter } from "@/components/public/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { hasAdminRole } from "@/lib/auth-utils"

export default function LoginPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  const isAdmin = hasAdminRole(role)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      router.push(isAdmin ? "/admin" : "/events")
    }
  }, [isAdmin, router, session])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message || "Unable to sign in.")
        return
      }
      router.push("/events")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-transparent to-amber-500/10" />
        <div className="absolute -top-20 left-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl items-center justify-center px-6 py-20">
          <Card className="w-full max-w-md glass-card">
            <CardHeader className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-bg">
                <Aperture className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sign in to manage events, tickets, and attendee data.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full gradient-bg hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                New to Aurora?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
