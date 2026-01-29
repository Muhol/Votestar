import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Votestar - Social Consensus Protocol",
  description: "Shape the future Wall through decentralized voting.",
};

import { AuthProvider } from "./components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
