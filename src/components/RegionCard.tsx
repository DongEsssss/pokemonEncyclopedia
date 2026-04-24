import React from 'react';
import Link from 'next/link';

interface RegionCardProps {
  name: string;
}

export default function RegionCard({ name }: RegionCardProps) {
  return (
    <Link href={`/region/${name}`}>
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg cursor-pointer transform transition hover:scale-105 hover:shadow-xl">
        <h2 className="text-2xl font-bold uppercase text-center tracking-widest">{name}</h2>
      </div>
    </Link>
  );
}
