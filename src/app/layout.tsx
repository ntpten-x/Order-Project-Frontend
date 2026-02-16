import type { Metadata } from "next";
import "./globals.css";
import { App } from "antd";

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
      <body>
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
