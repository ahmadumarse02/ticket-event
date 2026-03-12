"use client"

import { Button } from "@/components/ui/button"
import { LucideIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: PageHeaderProps) {
  const ActionIcon = action?.icon || Plus

  return (
    <div className={cn("mb-8 animate-fade-up", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        {/* Left: icon + text */}
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-bg shadow-glow">
              <Icon className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Right: children + action */}
        {(children || action) && (
          <div className="flex items-center gap-2 sm:mt-0.5">
            {children}
            {action && (
              <Button
                onClick={action.onClick}
                size="sm"
                className="gradient-bg hover:opacity-90 text-white shadow-glow font-semibold gap-1.5"
              >
                <ActionIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="mt-6 h-px bg-gradient-to-r from-border via-border-strong to-transparent" />
    </div>
  )
}
