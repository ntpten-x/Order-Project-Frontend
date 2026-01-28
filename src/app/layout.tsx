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
  title: "ORDER",
  description: "ORDER",
};

import AntdRegistry from "../lib/AntdRegistry";
import { SocketProvider } from "../contexts/SocketContext";
import { AuthProvider } from "../contexts/AuthContext";
import { GlobalLoadingProvider } from "../contexts/pos/GlobalLoadingContext";
import QueryProvider from "../providers/QueryProvider";
import AppHeader from "../components/AppHeader";
import ClientLayout from "../components/ClientLayout";

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
            <QueryProvider>
              <AuthProvider>
                <SocketProvider>
                  <AppHeader />
                  <ClientLayout>{children}</ClientLayout>
                </SocketProvider>
              </AuthProvider>
            </QueryProvider>
          </GlobalLoadingProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
