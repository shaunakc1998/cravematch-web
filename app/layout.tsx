import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CraveMatch - Swipe to Eat Together",
  description: "Find the perfect restaurant for your group. Swipe right on what you crave, match with friends, and discover your next meal together.",
  manifest: "/manifest.json",
  keywords: ["restaurant", "food", "dining", "group decision", "swipe", "match", "friends"],
  authors: [{ name: "CraveMatch" }],
  creator: "CraveMatch",
  publisher: "CraveMatch",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cravematch.app",
    siteName: "CraveMatch",
    title: "CraveMatch - Swipe to Eat Together",
    description: "Find the perfect restaurant for your group. Swipe right on what you crave!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CraveMatch - Swipe to Eat Together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CraveMatch - Swipe to Eat Together",
    description: "Find the perfect restaurant for your group. Swipe right on what you crave!",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CraveMatch",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#050505" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-white`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#f43f5e] focus:text-white focus:rounded-lg"
          >
            Skip to main content
          </a>
          
          {/* Main app wrapper */}
          <div id="main-content" className="relative min-h-screen">
            {children}
          </div>
          
          {/* Portal root for modals */}
          <div id="modal-root" />
        </AuthProvider>
      </body>
    </html>
  );
}
