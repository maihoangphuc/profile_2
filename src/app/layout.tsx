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
  title: "Greta Thunberg — 2019",
  description:
    "An illustrated timeline of how Greta Thunberg rose from a solo campaigner to the leader of a global movement in 2019.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${roboto.className} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
