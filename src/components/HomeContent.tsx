"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import RegionCard from './RegionCard';
import { Region } from '../services/pokeapi';

interface HomeContentProps {
  regions: Region[];
}

export default function HomeContent({ regions }: HomeContentProps) {
  const { t } = useTranslation();

  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <header className="mb-14 text-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-widest text-yellow-400 drop-shadow-[0_4px_4px_rgba(59,76,202,0.8)]" style={{ WebkitTextStroke: '2px #3B4CCA' }}>
          {t("Pokemon Battle Simulator")}
        </h1>
        <p className="mt-6 text-gray-700 font-bold text-xl drop-shadow-sm">{t("Select a region to choose your Pokemon!")}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {regions.map((region) => (
          <RegionCard key={region.name} name={region.name} />
        ))}
      </div>
    </main>
  );
}
