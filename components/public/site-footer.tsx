import Link from "next/link"
import { Aperture } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
              <Aperture className="h-4 w-4 text-white" />
            </span>
            <span className="text-base font-semibold">Aurora</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Built for modern event teams with real-time inventory, seamless ticketing, and
            analytics that keep you ahead of demand.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
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
        </div>
      </div>
    </footer>
  )
}
