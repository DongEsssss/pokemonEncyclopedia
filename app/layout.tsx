import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./design.css";
import { BattleProvider } from "../src/context/BattleContext";
import { I18nProvider } from "../src/i18n/I18nProvider";
import AppHeader from "../src/components/AppHeader";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-data",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokemon Battle Simulator",
  description: "A fun Pokemon battle simulation game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col relative">
        <I18nProvider>
          <BattleProvider>
            <AppHeader />
            {children}
          </BattleProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
