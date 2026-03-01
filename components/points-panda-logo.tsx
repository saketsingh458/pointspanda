"use client"

import Link from "next/link"

export function PointsPandaLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-foreground transition-opacity hover:opacity-90 ${className ?? ""}`}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary"
        aria-hidden
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-5"
          role="img"
          aria-label="Points Panda logo"
        >
          <circle cx="20" cy="18" r="11" fill="white" />
          <circle cx="12" cy="10" r="5" fill="#1f2937" />
          <circle cx="28" cy="10" r="5" fill="#1f2937" />
          <ellipse cx="15" cy="17" rx="3.5" ry="3" fill="#1f2937" />
          <ellipse cx="25" cy="17" rx="3.5" ry="3" fill="#1f2937" />
          <ellipse cx="20" cy="21" rx="1.2" ry="0.8" fill="#1f2937" />
          <rect x="15" y="24" width="10" height="7" rx="1.2" fill="#1f2937" />
          <rect
            x="15"
            y="25"
            width="10"
            height="1.2"
            rx="0.4"
            fill="white"
            opacity={0.6}
          />
        </svg>
      </div>
      <span className="text-sm font-semibold tracking-tight md:text-base">
        Points Panda
      </span>
    </Link>
  )
}
