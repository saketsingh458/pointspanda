"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePointPath } from "@/contexts/pointpath-context"

const STEPS = [
  { label: "Spend", num: 1, path: "/intake" },
  { label: "Wallet", num: 2, path: "/wallet" },
  { label: "Strategy", num: 3, path: "/strategy" },
]

export function StepIndicator({ currentStep = 1 }: { currentStep?: number }) {
  const { walletCardIds } = usePointPath()

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep === 3) return walletCardIds.length > 0
    return true
  }

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
          {(() => {
            const isDisabled = step.num > currentStep && !canNavigateToStep(step.num)

            return (
              <Link
                href={step.path}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-9",
                  step.num === currentStep
                    ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground/80",
                  isDisabled && "pointer-events-none opacity-50"
                )}
                aria-current={step.num === currentStep ? "step" : undefined}
                aria-label={`Step ${step.num}: ${step.label}`}
                aria-disabled={isDisabled}
                onClick={(event) => {
                  if (isDisabled) event.preventDefault()
                }}
                title={isDisabled ? "Add at least one card in Wallet to continue." : undefined}
              >
                {step.num}
              </Link>
            )
          })()}
        </span>
      ))}
    </nav>
  )
}
