import "../src/styles/globals.css";
import type { Metadata } from "next";
import React from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Completionist Tracker",
  description: "Wii-inspired completion tracking with nested milestones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
