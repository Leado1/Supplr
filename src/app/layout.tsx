import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { RouteLoading } from "@/components/providers/route-loading";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supplr - Medical Inventory Management",
  description:
    "Simple, visual inventory management for medical practices. Track supplies, expiration dates, and stock levels.",
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
        <body className="font-neue-haas antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <RouteLoading />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
