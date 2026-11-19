"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    document.documentElement.lang = activeLanguage;
  }, [activeLanguage]);

  return (
    <div className="lab-languages" role="group" aria-label="Language">
      {languages.map(({ code, name }) => (
        <button
          type="button"
          key={code}
          lang={code}
          aria-label={name}
          aria-pressed={activeLanguage === code}
          onClick={() => void i18n.changeLanguage(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
