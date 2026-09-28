import type { MetadataRoute } from "next";
import { APP_BRAND } from "@/lib/constants/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_BRAND.name} — ${APP_BRAND.shortTagline}`,
    short_name: APP_BRAND.name,
    description: APP_BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0d1a",
    theme_color: "#0a0d1a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "wide",
      },
    ],
    categories: ["productivity", "utilities"],
    lang: "en",
    dir: "ltr",
    orientation: "any",
    prefer_related_applications: false,
  };
}
