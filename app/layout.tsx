import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gambl Poker — Texas Hold’em",
  description: "Take your seat at a polished Texas Hold’em table. Play CPU rivals, learn with a guided tutorial, and prepare a private room.",
  applicationName: "Gambl Poker",
  metadataBase: new URL("https://gambl-poker.fantomzone.app"),
  openGraph: {
    title: "Gambl Poker — Own the Pot",
    description: "Every card. Every tell. Every chip. Play Texas Hold’em on desktop or mobile.",
    siteName: "Gambl Poker",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gambl Poker — Sit down. Own the pot." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gambl Poker — Own the Pot",
    description: "A premium Texas Hold’em table built for desktop and mobile.",
    images: ["/og.png"],
  },
  icons: { icon: "/og.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
