import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <div className="space-y-4">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl lg:leading-[1.15]">
          Unlock Your Ultimate Credit Card Strategy.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Stop leaving points on the table. Discover the perfect mix of cards for
          your unique spending habits in just three simple steps.
        </p>
      </div>
      <div className="flex justify-center pt-2">
        <Button
          asChild
          size="lg"
          className="h-12 min-w-[180px] gap-2 px-8 text-base font-semibold shadow-md transition-all hover:shadow-lg"
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
