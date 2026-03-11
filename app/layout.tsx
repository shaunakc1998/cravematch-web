import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CraveMatch — Find where to eat together",
  description: "Swipe on restaurants, match with friends, and decide where to eat together. Fast, fun, no arguments.",
  manifest: "/manifest.json",
  keywords: ["restaurant", "food", "dining", "group decision", "swipe", "match"],
  authors: [{ name: "CraveMatch" }],
  creator: "CraveMatch",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CraveMatch",
    title: "CraveMatch — Find where to eat together",
    description: "Swipe on restaurants, match with friends, decide where to eat.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CraveMatch",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F2" },
    { media: "(prefers-color-scheme: dark)",  color: "#F7F6F2" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="antialiased"
        style={{ background: "#F7F6F2", color: "#1C1917" }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg"
            style={{ background: "#16A34A", color: "white" }}
          >
            Skip to main content
          </a>
          <div id="main-content" className="relative h-full">
            {children}
          </div>
          <div id="modal-root" />
        </AuthProvider>
      </body>
    </html>
  );
}
