import type { Metadata } from "next";
import PricingPageClient from "./pricing-client";

// Example of how to add metadata to a client component page
// by creating a server component wrapper
export const metadata: Metadata = {
  title: "Pricing - Medical Inventory Management Software",
  description:
    "Simple, transparent pricing for Supplr's medical inventory management platform. Choose the plan that fits your practice size, from solo practitioners to large multi-location chains.",
  keywords: [
    "medical inventory pricing",
    "clinic software cost",
    "medical practice subscription",
    "inventory management pricing",
    "healthcare software plans",
  ],
  openGraph: {
    title: "Pricing - Medical Inventory Management Software | Supplr",
    description:
      "Transparent pricing for medical inventory management. Start free, scale as you grow.",
    url: "https://www.supplr.net/pricing",
    images: [
      {
        url: "/images/pricing-og.png",
        width: 1200,
        height: 630,
        alt: "Supplr Pricing Plans for Medical Practices",
      },
    ],
  },
  twitter: {
    title: "Pricing - Medical Inventory Management Software | Supplr",
    description: "Transparent pricing for medical inventory management. Start free, scale as you grow.",
    images: ["/images/pricing-twitter.png"],
  },
  alternates: {
    canonical: "/pricing",
  },
};

// Structured data for pricing
const pricingStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Supplr Medical Inventory Management",
  description: "Professional inventory management platform for medical practices",
  url: "https://www.supplr.net",
  offers: [
    {
      "@type": "Offer",
      name: "Starter Plan",
      description: "Perfect for solo practitioners and small clinics",
      price: "29",
      priceCurrency: "USD",
      priceValidUntil: "2025-12-31",
      availability: "https://schema.org/InStock",
      url: "https://www.supplr.net/pricing",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "29",
        priceCurrency: "USD",
        unitText: "per month",
      },
    },
    {
      "@type": "Offer",
      name: "Professional Plan",
      description: "For growing practices with team collaboration needs",
      price: "89",
      priceCurrency: "USD",
      priceValidUntil: "2025-12-31",
      availability: "https://schema.org/InStock",
      url: "https://www.supplr.net/pricing",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "89",
        priceCurrency: "USD",
        unitText: "per month",
      },
    },
    {
      "@type": "Offer",
      name: "Enterprise Plan",
      description: "For large practices and multi-location chains",
      price: "Custom",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.supplr.net/pricing",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "150",
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pricingStructuredData),
        }}
      />
      <PricingPageClient />
    </>
  );
}