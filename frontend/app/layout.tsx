import type { Metadata } from "next";
import "./tailwind.css";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
// Rule 1: Context/providers live in app/_context/ (private folder prefix so it's not exposed as a public route)
import { AuthProvider } from "@/app/_context/AuthContext";


const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "CivicMitra",
  description: "Clean City. Better Tomorrow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
