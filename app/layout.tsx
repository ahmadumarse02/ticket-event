import "./globals.css";

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppThemeProvider } from "@/components/theme-provider";


const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aurora — Event Ticketing Platform",
  description: "Premium event ticketing and management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${jakarta.variable} ${syne.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AppThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AppThemeProvider>
      </body>
    </html>
  );
}
