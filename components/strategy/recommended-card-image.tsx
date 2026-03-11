"use client"

import { useState } from "react"
import Image from "next/image"

export function RecommendedCardImage({
  card,
}: {
  card: { name: string; imageUrl?: string }
}) {
  const [error, setError] = useState(false)
  const hasImage = !!card.imageUrl && !error

  return (
    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
      {hasImage ? (
        <Image
          src={card.imageUrl!}
          alt={card.name}
          fill
          className="object-cover object-center"
          sizes="128px"
          onError={() => setError(true)}
        />
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: "12px 12px",
            }}
          />
          <div className="absolute left-2 top-2 h-5 w-7 rounded-sm bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
          <p className="absolute inset-x-2 bottom-2 truncate text-[10px] font-medium text-white/80">
            {card.name}
          </p>
        </>
      )}
    </div>
  )
}
