import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative flex w-full max-w-2xl flex-col items-center gap-10 text-center">
      {/* Subtle gradient orb behind hero for depth */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative space-y-5">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl lg:leading-[1.12]">
          Unlock Your Ultimate{" "}
          <span className="text-primary">Credit Card Strategy</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Stop leaving points on the table. Discover the perfect mix of cards for
          your unique spending habits in just three simple steps.
        </p>
      </div>
      <div className="relative flex justify-center pt-2">
        <Button
          asChild
          size="lg"
          className="h-12 min-w-[200px] gap-2 px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
        >
          <Link href="/intake">
            Get Started
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  )
}
