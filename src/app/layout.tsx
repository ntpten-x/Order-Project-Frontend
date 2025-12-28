import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "T-DED STEAK ORDER",
  description: "T-DED STEAK ORDER",
};

import AntdRegistry from "../lib/AntdRegistry";
import { SocketProvider } from "../contexts/SocketContext";
import { AuthProvider } from "../contexts/AuthContext";
import { GlobalLoadingProvider } from "../contexts/GlobalLoadingContext";
import AppHeader from "../components/AppHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        <AntdRegistry>
          <GlobalLoadingProvider>
            <AuthProvider>
              <SocketProvider>
                <AppHeader />
                <main style={{ paddingTop: "64px" }}>
                  {children}
                </main>
              </SocketProvider>
            </AuthProvider>
          </GlobalLoadingProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
