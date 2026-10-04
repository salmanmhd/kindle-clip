import { Instrument_Sans, Literata, Noto_Serif_Devanagari, Noto_Naskh_Arabic } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const notodevanagari = Noto_Serif_Devanagari({
  weight: ["400", "700"],
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
})

const notoarabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
})

export const metadata = {
  title: "Kindle Clipper",
  description: "Read your Kindle highlights anywhere",
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Theme logic will be handled by the user preferences, default to paper theme
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased theme-paper", 
        instrumentSans.variable, 
        literata.variable, 
        notodevanagari.variable, 
        notoarabic.variable,
        "font-sans"
      )}
    >
      <body>
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-serif-stack: var(--font-serif), var(--font-devanagari), var(--font-arabic), serif;
          }
        `}} />
        {children}
      </body>
    </html>
  )
}
