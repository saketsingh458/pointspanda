import { HeroSection } from "@/components/hero-section"
import { FeatureCards } from "@/components/feature-cards"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsPandaLogo } from "@/components/points-panda-logo"
import { AppFooter } from "@/components/app-footer"

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4 md:px-10">
        <PointsPandaLogo />
        <div className="flex w-20 justify-end">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-14 px-6 py-12 md:gap-20 md:py-20">
        <HeroSection />
        <FeatureCards />
      </main>

      <AppFooter />
    </div>
  )
}
