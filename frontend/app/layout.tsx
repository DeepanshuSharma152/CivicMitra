import type { Metadata } from "next";
import "./globals.css";
import "./role-screens.css";

export const metadata: Metadata = {
  title: "CivicMitra",
  description: "Clean City. Better Tomorrow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
