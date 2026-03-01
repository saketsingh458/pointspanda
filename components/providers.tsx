"use client"

import { PointPathProvider } from "@/contexts/pointpath-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return <PointPathProvider>{children}</PointPathProvider>
}
