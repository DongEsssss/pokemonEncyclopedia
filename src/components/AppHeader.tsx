"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

export default function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/region/")) return null;

  return (
    <header className="lab-nav">
      <div>
        <Link className="lab-brand" href="/">
          <span className="lab-mark" aria-hidden="true" />
          Battle<span>Lab</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
