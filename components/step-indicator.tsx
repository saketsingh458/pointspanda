"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

const STEPS = [
  { label: "Spend", num: 1, path: "/intake" },
  { label: "Wallet", num: 2, path: "/wallet" },
  { label: "Strategy", num: 3, path: "/strategy" },
]

export function StepIndicator({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <nav className="flex items-center gap-0.5" aria-label="Progress">
      {STEPS.map((step, i) => (
        <span key={step.num} className="flex items-center">
          {i > 0 && (
            <span
              className={cn(
                "h-0.5 w-4 shrink-0 rounded-full transition-colors sm:w-6",
                step.num <= currentStep ? "bg-primary/60" : "bg-border"
              )}
              aria-hidden
            />
          )}
          <Link
            href={step.path}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-9",
              step.num === currentStep
                ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground/80"
            )}
            aria-current={step.num === currentStep ? "step" : undefined}
            aria-label={`Step ${step.num}: ${step.label}`}
          >
            {step.num}
          </Link>
        </span>
      ))}
    </nav>
  )
}
