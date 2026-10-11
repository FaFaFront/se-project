import type { Metadata } from "next";
import "./globals.css";
import { AuthGuard } from "@/components/guards/auth-guard";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "SE Project",
  description: "Next.js + Express starter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
        <Footer />
      </body>
    </html>
  );
}
