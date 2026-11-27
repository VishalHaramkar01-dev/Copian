import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { CmsProvider } from "@/components/CmsContext";
import GlobalShortcuts from "@/components/GlobalShortcuts";
import { PwaInstallProvider } from "@/components/PwaInstallProvider";

export const viewport: Viewport = {
  themeColor: "#00366B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Copian — B2B Printer Consumables & Bulk Supplies",
  description:
    "Copian International (Est. 1997): OEM-compatible toner cartridges, bulk toner powder, OPC drums, inkjet inks, and printer components with verified page yields and GST-compliant B2B quotations.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Copian B2B",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&family=Wix+Madefor+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-light-surface text-light-on-surface font-body antialiased">
        <PwaInstallProvider>
          <CmsProvider>
            <CartProvider>
              <GlobalShortcuts />
              {children}
            </CartProvider>
          </CmsProvider>
        </PwaInstallProvider>
      </body>
    </html>
  );
}
