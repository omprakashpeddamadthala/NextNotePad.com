import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { homeJsonLd } from "@/lib/seo/jsonLd";
import { HOME_PAGE, SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: { absolute: HOME_PAGE.title },
  description: HOME_PAGE.description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: HOME_PAGE.title,
    description: HOME_PAGE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_PAGE.title,
    description: HOME_PAGE.description,
  },
};

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <AppProviders>{children}</AppProviders>
    </>
  );
}
