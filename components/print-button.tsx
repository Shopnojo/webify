"use client"

import type React from "react"

export default function PrintButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <button onClick={() => window.print()} className={className}>
      {children ?? "Download / Print"}
    </button>
  )
}
