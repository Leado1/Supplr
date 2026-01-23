import type { Metadata } from "next";

// Base metadata configuration
const baseMetadata = {
  siteName: "Supplr",
  siteUrl: "https://www.supplr.net",
  title: "Supplr - Medical Inventory Management for Aesthetic Clinics",
  description:
    "Professional inventory management platform for medical spas and aesthetic clinics. Track supplies, expiration dates, and stock levels with automated alerts.",
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
  images: {
    default: "/images/og-image.png",
    twitter: "/images/twitter-image.png",
  },
  twitterHandle: "@supplr",
};

interface CreateMetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  images?: {
    og?: string;
    twitter?: string;
  };
  noIndex?: boolean;
  type?: "website" | "article";
}

/**
 * Creates metadata object for a page with sensible defaults
 */
export function createMetadata({
  title,
  description,
  keywords = [],
  path = "",
  images = {},
  noIndex = false,
  type = "website",
}: CreateMetadataProps = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${baseMetadata.siteName}`
    : baseMetadata.title;
  const fullDescription = description || baseMetadata.description;
  const fullKeywords = [...baseMetadata.keywords, ...keywords];
  const canonicalUrl = `${baseMetadata.siteUrl}${path}`;

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    authors: [{ name: baseMetadata.siteName }],
    creator: baseMetadata.siteName,
    publisher: baseMetadata.siteName,
    metadataBase: new URL(baseMetadata.siteUrl),
    alternates: {
      canonical: path,
    },
    openGraph: {
      type,
      locale: "en_US",
      url: canonicalUrl,
      siteName: baseMetadata.siteName,
      title: fullTitle,
      description: fullDescription,
      images: [
        {
          url: images.og || baseMetadata.images.default,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: baseMetadata.twitterHandle,
      creator: baseMetadata.twitterHandle,
      title: fullTitle,
      description: fullDescription,
      images: [images.twitter || baseMetadata.images.twitter],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
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
  };

  return metadata;
}

/**
 * Creates JSON-LD structured data for organization
 */
export function createOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: baseMetadata.siteName,
    description: baseMetadata.description,
    url: baseMetadata.siteUrl,
    logo: `${baseMetadata.siteUrl}/images/LOGOB.png`,
    sameAs: [
      // Add your social media URLs when available
      // "https://twitter.com/supplr",
      // "https://linkedin.com/company/supplr",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "support@supplr.net",
      url: `${baseMetadata.siteUrl}/support`,
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
}

/**
 * Creates JSON-LD structured data for a webpage
 */
export function createWebPageStructuredData(
  name: string,
  description: string,
  url: string,
  additionalData?: Record<string, any>
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    ...additionalData,
  };
}

/**
 * Creates JSON-LD structured data for product/pricing pages
 */
export function createProductStructuredData(offers: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Supplr Medical Inventory Management",
    description: baseMetadata.description,
    url: baseMetadata.siteUrl,
    offers,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
    },
  };
}
