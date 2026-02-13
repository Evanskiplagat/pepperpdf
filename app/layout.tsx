import "./globals.css";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

const uiFont = Outfit({
  subsets: ["latin"],
  variable: "--font-ui",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "PepperPDF",
  description: "PepperPDF editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
