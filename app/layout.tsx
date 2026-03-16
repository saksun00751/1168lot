import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import ContactFAB from "@/components/ui/ContactFAB";
import "./globals.css";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lotto",
  description: "หวยออนไลน์",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={noto.variable}>
      <body className="font-sans bg-ap-bg">
        {children}
        <ContactFAB />
      </body>
    </html>
  );
}
