import { Instrument_Sans, Literata, Noto_Serif_Devanagari, Noto_Naskh_Arabic } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "sonner"
import OfflineSync from "@/components/OfflineSync"

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

import type { Metadata, Viewport } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app';

export const viewport: Viewport = {
  themeColor: "#1C1B19",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Kindle Clipper — Read & Rediscover Your Kindle Highlights",
    template: "%s | Kindle Clipper",
  },
  description: "Transform your raw Kindle My Clippings.txt into an organized, searchable personal library. Read offline on any device.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kindle Clipper",
  },
};

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
        "antialiased", 
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
        <ThemeProvider attribute="class" defaultTheme="paper" themes={['paper', 'sepia', 'night']} disableTransitionOnChange>
          {children}
          <OfflineSync />
          <Toaster 
            position="bottom-center"
            toastOptions={{
              className: 'bg-popover text-ink border-border font-sans',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
