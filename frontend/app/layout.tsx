import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "MediCare AI – Your Personal AI Health Assistant",
  description:
    "Transform complex medical documents into clear explanations, track health trends over time, manage medications, and coordinate with caregivers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#F8FAFC]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

