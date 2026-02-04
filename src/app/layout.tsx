import type { Metadata } from "next";
import { Sarabun, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { App } from "antd";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POS",
  description: "POS",
};

import AntdRegistry from "../lib/AntdRegistry";
import { SocketProvider } from "../contexts/SocketContext";
import { AuthProvider } from "../contexts/AuthContext";
import { GlobalLoadingProvider } from "../contexts/pos/GlobalLoadingContext";
import QueryProvider from "../providers/QueryProvider";
import AppHeader from "../components/AppHeader";
import ClientLayout from "../components/ClientLayout";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${sarabun.variable} ${jetbrainsMono.variable}`}
      >
        <AntdRegistry>
          <App>
            <GlobalLoadingProvider>
              <QueryProvider>
                <AuthProvider>
                  <SocketProvider>
                    <ServiceWorkerRegistration />
                    <AppHeader />
                    <ClientLayout>{children}</ClientLayout>
                  </SocketProvider>
                </AuthProvider>
              </QueryProvider>
            </GlobalLoadingProvider>
          </App>
        </AntdRegistry>
      </body>
    </html>
  );
}
