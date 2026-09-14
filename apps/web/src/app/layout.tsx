import type { Metadata } from "next";
import "./globals.css";
import { AuthBoundary } from "@/components/auth/auth-boundary";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SE Project",
  description: "Next.js + Express starter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <AuthBoundary>{children}</AuthBoundary>
        <Footer />
      </body>
    </html>
  );
}
