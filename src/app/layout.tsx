import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Hackathon Template",
  description: "Next.js + Ant Design + Firebase (hackathon scaffold)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
