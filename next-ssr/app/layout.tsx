import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./index.css";
import "./App.css";
import { Providers } from "./providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Medingen - Buy Generic Medicines Online | Trusted Store",
  description: "Medingen offers affordable generic medicines and fast doorstep delivery across India. Shop online for trusted and quality healthcare products.",
  keywords: "generic medicines, online pharmacy, affordable healthcare, india pharmacy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
