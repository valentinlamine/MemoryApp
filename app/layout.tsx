import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/components/supabase-provider"
import { SpaceRepetitionProvider } from "@/components/space-repetition-provider"
import Header from "@/components/header"
import EnvironmentCheck from "./env-check"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Memory App - Spaced Repetition Learning",
  description: "Learn and memorize with spaced repetition"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
          disableTransitionOnChange
          storageKey="memory-app-theme"
        >
          <SupabaseProvider>
            <EnvironmentCheck />
            <SpaceRepetitionProvider>
              <div className="flex min-h-screen flex-col bg-background text-foreground">
                <Header />
                <main className="flex-1 bg-background text-foreground">{children}</main>
              </div>
              <Toaster />
            </SpaceRepetitionProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'