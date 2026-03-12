"use client"

import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatsCardProps {
  title:        string
  value:        string | number
  change?:      string
  changeType?:  "positive" | "negative" | "neutral"
  icon:         LucideIcon
  iconColor?:   string
  description?: string
  accent?:      "violet" | "cyan" | "emerald" | "amber" | "rose"
}

const accentMap = {
  violet:  { bg: "bg-primary/10",                  text: "text-primary",              glow: "group-hover:shadow-glow" },
  cyan:    { bg: "bg-accent/10",                   text: "text-accent",               glow: "group-hover:shadow-glow-cyan" },
  emerald: { bg: "bg-emerald-500/10",              text: "text-emerald-400",          glow: "" },
  amber:   { bg: "bg-amber-500/10",                text: "text-amber-400",            glow: "" },
  rose:    { bg: "bg-rose-500/10",                 text: "text-rose-400",             glow: "" },
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  accent = "violet",
  description,
}: StatsCardProps) {
  const a = accentMap[accent]

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl glass-card card-hover animate-fade-up",
      "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent",
      accent === "violet"  && "before:via-primary/50",
      accent === "cyan"    && "before:via-accent/50",
      accent === "emerald" && "before:via-emerald-500/50",
      accent === "amber"   && "before:via-amber-500/50",
      accent === "rose"    && "before:via-rose-500/50",
      "before:to-transparent",
    )}>

      {/* Ambient glow blob */}
      <div className={cn(
        "absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-40 pointer-events-none",
        accent === "violet"  && "bg-primary/20",
        accent === "cyan"    && "bg-accent/20",
        accent === "emerald" && "bg-emerald-500/20",
        accent === "amber"   && "bg-amber-500/20",
        accent === "rose"    && "bg-rose-500/20",
      )} />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{title}</p>
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
            a.bg, a.text
          )}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        </div>

        <div className="mt-4">
          <p className="font-display text-3xl font-bold tracking-tight">{value}</p>

          {(change || description) && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {change && changeType !== "neutral" && (
                changeType === "positive"
                  ? <TrendingUp  className="h-3.5 w-3.5 text-emerald-400" />
                  : <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              )}
              {change && changeType === "neutral" && (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
              {change && (
                <span className={cn(
                  "text-xs font-semibold",
                  changeType === "positive" && "text-emerald-400",
                  changeType === "negative" && "text-rose-400",
                  changeType === "neutral"  && "text-muted-foreground",
                )}>
                  {change}
                </span>
              )}
              {description && (
                <span className="text-xs text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
