import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const STEPS = [
  {
    step: 1,
    title: "Tell us how you spend",
    description:
      "Break down your estimated spending across categories like dining, travel, and groceries.",
  },
  {
    step: 2,
    title: "Share what's in your wallet",
    description:
      "Add your current credit cards so we know what rewards you are already earning today.",
  },
  {
    step: 3,
    title: "Get your optimized strategy",
    description:
      "Receive a personalized card portfolio recommendation that maximizes your annual points and travel benefits.",
  },
]

export function FeatureCards() {
  return (
    <section className="flex w-full max-w-4xl flex-col items-center gap-10 pt-4 md:gap-14 md:pt-8">
      <h2 className="text-center text-lg font-semibold text-muted-foreground md:text-xl">
        How it works
      </h2>
      <div className="grid w-full gap-6 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((item) => (
          <Card
            key={item.step}
            className="flex flex-col border-border shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
          >
            <CardHeader className="flex flex-col gap-4 text-left">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold tabular-nums text-primary-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                {item.step}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-base leading-tight md:text-lg">
                  {item.title}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {item.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-auto pt-0" />
          </Card>
        ))}
      </div>
    </section>
  )
}
