"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Menu, X } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsPandaLogo } from "@/components/points-panda-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_STEPS = [
  { num: 1, label: "Spend", path: "/intake", shortLabel: "1" },
  { num: 2, label: "Wallet", path: "/wallet", shortLabel: "2" },
  { num: 3, label: "Strategy", path: "/strategy", shortLabel: "3" },
] as const

interface AppHeaderProps {
  /** Current step number (1-3) for highlighting in the nav */
  currentStep?: 1 | 2 | 3
  /** Whether to show back button (mobile) */
  showBack?: boolean
  /** Custom back path */
  backPath?: string
  /** Whether to show the step indicator */
  showSteps?: boolean
}

export function AppHeader({
  currentStep,
  showBack = false,
  backPath,
  showSteps = true,
}: AppHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auto-detect current step from pathname if not provided
  const detectedStep =
    currentStep ??
    (pathname === "/intake"
      ? 1
      : pathname === "/wallet"
        ? 2
        : pathname === "/strategy"
          ? 3
          : undefined)

  // Auto-detect back path
  const computedBackPath =
    backPath ??
    (detectedStep === 2
      ? "/intake"
      : detectedStep === 3
        ? "/wallet"
        : "/")

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        {/* Left: Logo or Back button on mobile */}
        <div className="flex items-center gap-3">
          {showBack && detectedStep && detectedStep > 1 ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Go back"
            >
              <Link href={computedBackPath}>
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
          ) : null}
          <Link href="/" className="flex items-center gap-2">
            <PointsPandaLogo />
          </Link>
        </div>

        {/* Center: Step indicator (desktop) */}
        {showSteps && detectedStep && (
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Progress steps"
          >
            {NAV_STEPS.map((step, i) => {
              const isActive = step.num === detectedStep
              const isCompleted = step.num < detectedStep
              const isAccessible = step.num <= detectedStep

              return (
                <div key={step.num} className="flex items-center">
                  {i > 0 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 w-8 rounded-full transition-colors",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                      aria-hidden
                    />
                  )}
                  <Link
                    href={isAccessible ? step.path : "#"}
                    className={cn(
                      "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isCompleted
                          ? "text-primary hover:bg-primary/10"
                          : "text-muted-foreground"
                    )}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Step ${step.num}: ${step.label}`}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                        isActive
                          ? "bg-primary-foreground/20"
                          : isCompleted
                            ? "bg-primary/15"
                            : "bg-muted"
                      )}
                    >
                      {step.num}
                    </span>
                    {step.label}
                  </Link>
                </div>
              )
            })}
          </nav>
        )}

        {/* Center: Compact step indicator (mobile) */}
        {showSteps && detectedStep && (
          <div className="flex items-center gap-1.5 md:hidden" aria-label="Progress">
            {NAV_STEPS.map((step, i) => {
              const isActive = step.num === detectedStep
              const isCompleted = step.num < detectedStep

              return (
                <div key={step.num} className="flex items-center">
                  {i > 0 && (
                    <div
                      className={cn(
                        "mx-0.5 h-0.5 w-4 rounded-full",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                      aria-hidden
                    />
                  )}
                  <Link
                    href={step.num <= detectedStep ? step.path : "#"}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isCompleted
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Step ${step.num}: ${step.label}`}
                  >
                    {step.num}
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {/* Mobile menu button for secondary actions */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_STEPS.map((step) => {
              const isActive = step.num === detectedStep
              const isAccessible = detectedStep ? step.num <= detectedStep : true

              return (
                <Link
                  key={step.num}
                  href={isAccessible ? step.path : "#"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : isAccessible
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-sm font-bold",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {step.num}
                  </span>
                  {step.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
