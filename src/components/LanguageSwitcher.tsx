"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button 
        onClick={() => changeLanguage('ko')}
        className={`px-3 py-1 text-sm font-bold rounded-full transition ${i18n.language === 'ko' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        KO
      </button>
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 text-sm font-bold rounded-full transition ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('ja')}
        className={`px-3 py-1 text-sm font-bold rounded-full transition ${i18n.language === 'ja' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        JA
      </button>
    </div>
  );
}
