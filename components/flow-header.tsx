"use client"

import { PointsPandaLogo } from "@/components/points-panda-logo"
import { StepIndicator } from "@/components/step-indicator"
import { ThemeToggle } from "@/components/theme-toggle"

type FlowHeaderProps = {
  currentStep: 1 | 2 | 3
  stepTitle: string
}

export function FlowHeader({ currentStep, stepTitle }: FlowHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-10">
        <PointsPandaLogo compactOnMobile />
        <div className="flex flex-col items-center gap-1">
          <StepIndicator currentStep={currentStep} />
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {`Step ${currentStep} of 3: ${stepTitle}`}
          </p>
        </div>
        <div className="flex w-10 justify-end sm:w-20">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
