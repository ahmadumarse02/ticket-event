"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Package,
  Ticket,
  Users,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Aperture,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/public/theme-toggle"

const navigation = [
  { name: "Dashboard",       href: "/admin",               icon: LayoutDashboard },
  { name: "Events",          href: "/admin/events",         icon: Calendar },
  { name: "Packages",        href: "/admin/packages",       icon: Package },
  { name: "Ticket Designer", href: "/admin/tickets",        icon: Ticket },
  { name: "Customers",       href: "/admin/customers",      icon: Users },
  { name: "Transactions",    href: "/admin/transactions",   icon: CreditCard },
  { name: "Reports",         href: "/admin/reports",        icon: BarChart3 },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "relative flex flex-col transition-all duration-300 ease-in-out shrink-0",
          "bg-sidebar border-r border-sidebar-border",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Mesh gradient accent top */}
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none overflow-hidden rounded-none">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -top-4 right-4 w-24 h-24 rounded-full bg-accent/8 blur-2xl" />
        </div>

        {/* Logo */}
        <div className={cn(
          "relative flex h-14 items-center border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center px-0" : "px-4 gap-3"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-bg shadow-glow">
            <Aperture className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-sm tracking-tight text-foreground">Aurora</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase mt-0.5">Platform</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className={cn("space-y-0.5", collapsed ? "px-2" : "px-2")}>
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    collapsed && "justify-center px-0 w-10 mx-auto"
                  )}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full gradient-bg" />
                  )}

                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  {!collapsed && (
                    <span className="font-medium truncate">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-[52px] z-10",
            "flex h-6 w-6 items-center justify-center rounded-full",
            "bg-card border border-border-strong shadow-card",
            "text-muted-foreground hover:text-foreground transition-colors",
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3" />
            : <ChevronLeft  className="h-3 w-3" />
          }
        </button>

        {/* Footer */}
        <div className={cn(
          "border-t border-sidebar-border py-3 shrink-0",
          collapsed ? "px-2" : "px-4"
        )}>
          {collapsed ? (
            <div className="flex justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dot-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dot-pulse shrink-0" />
              <span className="text-[11px] text-muted-foreground font-medium">All systems operational</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-border shrink-0 flex items-center px-6 gap-3 bg-card/40 backdrop-blur-sm">
          <div className="flex-1" />
          <ThemeToggle />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-secondary font-mono">v1.0</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
