import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stellar White Belt — Testnet dApp",
  description:
    "Connect Freighter, check your XLM balance, and send payments on the Stellar Testnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${roboto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground relative flex min-h-full flex-col">
        <div className="aurora pointer-events-none fixed inset-0 -z-10" />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>

  );
}
