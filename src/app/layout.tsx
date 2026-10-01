import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { WARNA_BILAH_PERAMBAN } from "@/lib/constants";
import Script from "next/script";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JoyOps",
    template: "%s | JoyOps",
  },
  description:
    "Sistem operasional laundry: kasir, mesin, shift, absensi, dan keuangan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: WARNA_BILAH_PERAMBAN.terang },
    { media: "(prefers-color-scheme: dark)", color: WARNA_BILAH_PERAMBAN.gelap },
  ],
};

/* Dipasang sebelum bodi dirender supaya tema tidak berkedip. */
const skripTema = `
try {
  var pilihan = localStorage.getItem("joyops-tema");
  if (pilihan === "gelap") document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${manrope.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Font ikon Material Symbols dan Ionicons (https://ionic.io/ionicons) */}
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <script dangerouslySetInnerHTML={{ __html: skripTema }} />
      </head>
      <body>
        {children}
        <Script
          type="module"
          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
          strategy="lazyOnload"
        />
        <Script
          noModule
          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
