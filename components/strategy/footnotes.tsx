import type { StrategyResult } from "@/lib/types"

export function FootnotesSection({ strategy }: { strategy: StrategyResult }) {
  return (
    <>
      {strategy.strategyAssumptions.length > 0 && (
        <section id="strategy-assumptions" className="mt-14 scroll-mt-28">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assumptions used
            </p>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-sm text-muted-foreground">
              {strategy.strategyAssumptions.map((assumption) => (
                <li key={assumption.id}>
                  <span className="font-medium text-foreground">{assumption.title}:</span>{" "}
                  {assumption.assumption}
                  {assumption.whyItMatters ? (
                    <span className="block text-xs text-muted-foreground/90">
                      Why this matters: {assumption.whyItMatters}
                    </span>
                  ) : null}
                  {assumption.sourceLabel ? (
                    <span className="block text-xs text-muted-foreground/90">
                      Source: {assumption.sourceLabel}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {strategy.strategyLimitations.length > 0 && (
        <section className="mt-4">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Strategy limitations
            </p>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-sm text-muted-foreground">
              {strategy.strategyLimitations.map((limitation) => (
                <li key={limitation.id}>
                  <span className="font-medium text-foreground">{limitation.title}:</span>{" "}
                  {limitation.limitation}
                  {limitation.whyItMatters ? (
                    <span className="block text-xs text-muted-foreground/90">
                      Why this matters: {limitation.whyItMatters}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
