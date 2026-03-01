"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

const STEPS = [
  { label: "Connect", num: 1, path: "/intake" },
  { label: "Track", num: 2, path: "/wallet" },
  { label: "Earn", num: 3, path: "/strategy" },
]

export function StepIndicator({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <nav className="flex items-center gap-1.5" aria-label="Progress">
      {STEPS.map((step, i) => (
        <span key={step.num} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="h-px w-3 bg-border shrink-0" aria-hidden />
          )}
          <Link
            href={step.path}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors hover:opacity-90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              step.num === currentStep
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
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
