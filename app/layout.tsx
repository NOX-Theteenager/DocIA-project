import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/lib/theme-context"
import { PWAInstall } from "@/components/pwa-install"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DocIA - Votre Assistant Santé Intelligent",
  description:
    "DocIA est votre compagnon santé intelligent qui vous accompagne dans vos questions médicales avec des réponses fiables et personnalisées, disponible 24h/24 et 7j/7.",
  keywords: "santé, assistant médical, IA, Douala General Hospital, DocIA, intelligence artificielle, médecine",
  authors: [{ name: "DocIA Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "DocIA - Votre Assistant Santé Intelligent",
    description: "Votre compagnon santé intelligent disponible 24h/24",
    type: "website",
    locale: "fr_FR",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f766e" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" /> {/* Ajout de la balise recommandée */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DocIA" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <PWAInstall />
          </AuthProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
