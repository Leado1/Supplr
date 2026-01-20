import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { RouteLoading } from "@/components/providers/route-loading";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Supplr - Medical Inventory Management for Aesthetic Clinics",
    template: "%s | Supplr",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico?v=2",
        sizes: "any",
      },
      {
        url: "/icon.png?v=2",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/images/logo.png?v=2",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png?v=2",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico?v=2",
  },
  description:
    "Professional inventory management platform for medical spas and aesthetic clinics. Track supplies, expiration dates, and stock levels with automated alerts and team collaboration.",
  keywords: [
    "medical inventory",
    "aesthetic clinic software",
    "medical spa management",
    "expiration tracking",
    "clinic supplies",
    "medical inventory software",
    "aesthetic practice management",
    "medical supply tracking",
  ],
  authors: [{ name: "Supplr" }],
  creator: "Supplr",
  publisher: "Supplr",
  metadataBase: new URL("https://www.supplr.net"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.supplr.net",
    siteName: "Supplr",
    title: "Supplr - Medical Inventory Management for Aesthetic Clinics",
    description:
      "Professional inventory management platform for medical spas and aesthetic clinics. Track supplies, expiration dates, and stock levels with automated alerts.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Supplr - Medical Inventory Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@supplr",
    creator: "@supplr",
    title: "Supplr - Medical Inventory Management for Aesthetic Clinics",
    description:
      "Professional inventory management platform for medical spas and aesthetic clinics. Track supplies, expiration dates, and stock levels.",
    images: ["/images/twitter-image.png"],
  },
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
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // bing: "your-bing-verification-code",
  },
};

// Organization structured data for SEO
const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Supplr",
  description: "Professional inventory management platform for medical spas and aesthetic clinics",
  url: "https://www.supplr.net",
  logo: "https://www.supplr.net/images/logo.png",
  sameAs: [
    // Add your social media URLs when available
    // "https://twitter.com/supplr",
    // "https://linkedin.com/company/supplr",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "support@supplr.net",
    url: "https://www.supplr.net/support",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
  },
  founder: {
    "@type": "Organization",
    name: "Supplr Team",
  },
  applicationCategory: "Business Application",
  applicationSubCategory: "Medical Practice Management",
  operatingSystem: "Web Browser",
  softwareVersion: "1.0",
  offers: {
    "@type": "Offer",
    category: "SaaS",
    businessFunction: "http://purl.org/goodrelations/v1#Sell",
  },
  audience: {
    "@type": "Audience",
    audienceType: "Medical Practices, Aesthetic Clinics, Medical Spas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Explicit favicon meta tags to override browser cache */}
          <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
          <link rel="icon" type="image/png" href="/icon.png?v=2" sizes="32x32" />
          <link rel="apple-touch-icon" href="/apple-icon.png?v=2" />
          <link rel="shortcut icon" href="/favicon.ico?v=2" />

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationStructuredData),
            }}
          />
        </head>
        <body className="font-neue-haas antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <RouteLoading />
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
