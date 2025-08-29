import type React from "react"
import "./globals.css"
import localFont from "next/font/local"

const navFont = localFont({
  src: [
    { path: "../public/fonts/LL-LETTERA.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/LL-LETTERA-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-nav",
  display: "swap",
})
const bodyMono = localFont({
  src: [
    { path: "../public/fonts/NType82Mono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/NType82Mono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${navFont.variable} ${bodyMono.variable} antialiased`}>
      <body className="min-h-screen bg-app-gradient text-foreground">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
