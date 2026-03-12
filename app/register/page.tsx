"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Aperture, Lock, Mail, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { SiteHeader } from "@/components/public/site-header"
import { SiteFooter } from "@/components/public/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { hasAdminRole } from "@/lib/auth-utils"

const registerSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  const isAdmin = hasAdminRole(role)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (session) {
      router.push(isAdmin ? "/admin" : "/events")
    }
  }, [isAdmin, router, session])

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root")
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      if (signUpError) {
        setError("root", {
          message: signUpError.message || "Unable to create your account.",
        })
        return
      }
      router.push("/events")
    } catch (err) {
      setError("root", { message: (err as Error).message })
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-transparent to-amber-500/10" />
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl items-center justify-center px-6 py-20">
          <Card className="w-full max-w-md glass-card">
            <CardHeader className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-bg">
                <Aperture className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <p className="text-sm text-muted-foreground">
                Join Aurora to unlock real-time ticketing and event insights.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      {...register("name")}
                      className="pl-9"
                      placeholder="Jordan Lee"
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className="pl-9"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      className="pl-9"
                      placeholder="Minimum 8 characters"
                      required
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      className="pl-9"
                      placeholder="Re-enter your password"
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
                {errors.root?.message && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errors.root.message}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full gradient-bg hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
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
