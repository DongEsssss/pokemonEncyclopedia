import type { Metadata } from "next";
import { Nunito, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { BattleProvider } from "../src/context/BattleContext";
import { I18nProvider } from "../src/i18n/I18nProvider";
import LanguageSwitcher from "../src/components/LanguageSwitcher";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
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
      className={`${nunito.variable} ${pressStart2P.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col relative">
        <I18nProvider>
          <BattleProvider>
            <LanguageSwitcher />
            {children}
          </BattleProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
