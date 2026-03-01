"use client"

import Link from "next/link"

export function PointsPandaLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg ${className ?? ""}`}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
        aria-hidden
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-6 [&_.panda-face]:fill-[var(--primary-foreground)] [&_.panda-ink]:fill-[var(--foreground)]"
          role="img"
          aria-label="Points Panda logo"
        >
          <circle className="panda-face" cx="20" cy="18" r="11" />
          <circle className="panda-ink" cx="12" cy="10" r="5" />
          <circle className="panda-ink" cx="28" cy="10" r="5" />
          <ellipse className="panda-ink" cx="15" cy="17" rx="3.5" ry="3" />
          <ellipse className="panda-ink" cx="25" cy="17" rx="3.5" ry="3" />
          <ellipse className="panda-ink" cx="20" cy="21" rx="1.2" ry="0.8" />
          <rect className="panda-ink" x="15" y="24" width="10" height="7" rx="1.2" />
          <rect
            className="panda-face"
            x="15"
            y="25"
            width="10"
            height="1.2"
            rx="0.4"
            opacity={0.6}
          />
        </svg>
      </div>
      <span className="text-sm font-semibold tracking-tight text-foreground md:text-base">
        Points Panda
      </span>
    </Link>
  )
}
