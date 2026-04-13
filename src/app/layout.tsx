import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@/app/globals.css";
import "@/app/animations.css";

const roboto = Roboto({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "MHP",
  description:
    "Frontend Developer passionate about technology and crafting intuitive, visually appealing user interfaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${roboto.className} h-full antialiased experience-loading`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
