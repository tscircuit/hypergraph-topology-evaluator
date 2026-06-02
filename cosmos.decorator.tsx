import type { ReactNode } from "react"

export default function CosmosDecorator({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {children}
    </div>
  )
}
