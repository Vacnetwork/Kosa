import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { KOSA } from "@/lib/brand";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosa.example.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${KOSA.shortName} — ${KOSA.name}`,
    template: `%s — ${KOSA.shortName}`,
  },
  description:
    "Kakoma Old Students Association connects former students across every cohort: membership, events, welfare, bursaries and community projects. United by our past, committed to our future.",
  applicationName: KOSA.shortName,
  keywords: ["KOSA", "Kakoma", "alumni", "Uganda", "old students association", "bursary", "welfare"],
  openGraph: {
    type: "website",
    siteName: KOSA.name,
    title: `${KOSA.shortName} — ${KOSA.name}`,
    description: KOSA.motto,
    locale: "en_UG",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organisation = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: KOSA.name,
    alternateName: KOSA.shortName,
    slogan: KOSA.motto,
    url: siteUrl,
    areaServed: "UG",
    description:
      "Alumni association of former students of Kakoma, Uganda: membership, welfare, bursaries and community projects.",
  };

  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-navy focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-center" richColors closeButton />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
      </body>
    </html>
  );
}
