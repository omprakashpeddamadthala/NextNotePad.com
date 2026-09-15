import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

import { APP_BRAND } from "@/lib/constants/branding";
import { SEO_KEYWORDS } from "@/lib/constants/seoKeywords";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nextnotepad.com"),
  title: {
    default: "NextNotePad — Free Online Notepad & Browser Code Editor (Fast, Offline-First)",
    template: "%s | NextNotePad.com — Online Notepad",
  },
  description:
    "NextNotePad (NextNotePad.com) is the #1 free online notepad and browser code editor. Zero install, offline-first with multi-tabs, syntax highlighting, Google Drive sync, diff checker, and developer tools. The modern Notepad++ alternative for your browser.",
  applicationName: "NextNotePad Online Notepad",
  keywords: SEO_KEYWORDS,
  authors: [{ name: "NextNotePad Team", url: "https://nextnotepad.com" }],
  creator: "NextNotePad.com",
  publisher: "NextNotePad.com",
  category: "online notepad, developer tools, productivity, text editor",
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://nextnotepad.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_BRAND.name,
  },
  openGraph: {
    title: "NextNotePad — Free Online Notepad & Browser Code Editor",
    description:
      "The fastest free online notepad and browser code editor with multi-tabs, syntax highlighting, offline-first storage, Google Drive sync, and developer text tools.",
    url: "https://nextnotepad.com",
    siteName: APP_BRAND.domain,
    locale: "en_US",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "NextNotePad Online Notepad" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextNotePad — Free Online Notepad & Browser Code Editor",
    description:
      "The fastest free online notepad and browser code editor with multi-tabs, syntax highlighting, offline-first storage, and Google Drive sync.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NextNotePad",
  alternateName: [
    "NextNotePad.com",
    "NextNoteNotePad.com",
    "Online Notepad",
    "Browser NotePad",
    "Online Note Pad",
    "Notepad++ Online",
    "Web Notepad",
    "Notepad Web",
    "Browser Notepad with Tabs"
  ],
  url: "https://nextnotepad.com",
  applicationCategory: "DeveloperApplication, UtilitiesApplication",
  operatingSystem: "All (Web Browser, Windows, macOS, Linux, ChromeOS, iOS, Android)",
  description:
    "Free online notepad and browser code editor with tabs, offline-first storage, syntax highlighting for 50+ languages, and Google Drive sync.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1840",
    bestRating: "5",
  },
  featureList: [
    "Multi-Tab Text & Code Editing",
    "Offline-First Guest Mode with IndexedDB",
    "Google Drive Cloud Backup & Sync",
    "Syntax Highlighting for 50+ Languages",
    "Diff Checker and File Comparison",
    "Developer Text Utilities and JSON Formatter",
    "Soft-Delete Recycle Bin File Recovery",
    "PWA Installable App"
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var observer = new MutationObserver(function(mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked' && m.target && m.target.removeAttribute) {
                      m.target.removeAttribute('bis_skin_checked');
                    }
                  }
                });
                observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked'] });
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="flex h-full min-h-full flex-col overflow-hidden"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
