"use client"

import { cn } from "@/lib/utils"

type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "default"
  | "published"
  | "draft"
  | "cancelled"
  | "completed"
  | "pending"
  | "failed"
  | "refunded"
  | "active"
  | "inactive"

interface StatusBadgeProps {
  status: string
  type?: StatusType
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; ring: string }> = {
  success:   { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-500/20" },
  warning:   { bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-400",   ring: "ring-amber-500/20" },
  error:     { bg: "bg-rose-500/10",    text: "text-rose-400",    dot: "bg-rose-400",    ring: "ring-rose-500/20" },
  info:      { bg: "bg-sky-500/10",     text: "text-sky-400",     dot: "bg-sky-400",     ring: "ring-sky-500/20" },
  default:   { bg: "bg-secondary",      text: "text-muted-foreground", dot: "bg-muted-foreground", ring: "" },
  published: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-500/20" },
  draft:     { bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-400",   ring: "ring-amber-500/20" },
  cancelled: { bg: "bg-rose-500/10",    text: "text-rose-400",    dot: "bg-rose-400",    ring: "ring-rose-500/20" },
  completed: { bg: "bg-violet-500/10",  text: "text-violet-400",  dot: "bg-violet-400",  ring: "ring-violet-500/20" },
  pending:   { bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-400",   ring: "ring-amber-500/20" },
  failed:    { bg: "bg-rose-500/10",    text: "text-rose-400",    dot: "bg-rose-400",    ring: "ring-rose-500/20" },
  refunded:  { bg: "bg-orange-500/10",  text: "text-orange-400",  dot: "bg-orange-400",  ring: "ring-orange-500/20" },
  active:    { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-500/20" },
  inactive:  { bg: "bg-secondary",      text: "text-muted-foreground", dot: "bg-muted-foreground", ring: "" },
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const statusKey = (type || status.toLowerCase()) as StatusType
  const config = statusConfig[statusKey] || statusConfig.default

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        "text-[11px] font-semibold tracking-wide uppercase",
        "ring-1",
        config.bg,
        config.text,
        config.ring || "ring-border"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      {status}
    </span>
  )
}
