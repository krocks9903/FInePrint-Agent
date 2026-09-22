import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinePrint Agent",
  description:
    "Upload a lease or contract. Get a grounded list of ways it can cost you money.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
