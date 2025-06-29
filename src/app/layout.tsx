import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/web3-provider";
import { ErrorBoundary, WalletErrorFallback } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZCORP Token Launcher",
  description: "Deploy tokens as ZCORP - Token gated platform for ZCORP holders",
  keywords: ["ZCORP", "token", "launcher", "deploy", "crypto", "base", "clanker"],
  authors: [{ name: "ZCORP Team" }],
  openGraph: {
    title: "ZCORP Token Launcher",
    description: "Deploy tokens as ZCORP - Token gated platform for ZCORP holders",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary fallback={WalletErrorFallback}>
          <Web3Provider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </Web3Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
