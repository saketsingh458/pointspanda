import { HeroSection } from "@/components/hero-section"
import { FeatureCards } from "@/components/feature-cards"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader showSteps={false} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-4 py-8 md:gap-16 md:px-6 md:py-16">
        <HeroSection />
        <FeatureCards />
      </main>

      <AppFooter />
    </div>
  )
}
