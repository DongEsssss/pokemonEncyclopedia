import React from 'react';
import Link from 'next/link';

interface RegionCardProps {
  name: string;
}

export default function RegionCard({ name }: RegionCardProps) {
  return (
    <Link href={`/region/${name}`}>
      <div className="relative overflow-hidden rounded-3xl h-48 shadow-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-4 border-gray-800 bg-white group">
        {/* Top Red Half */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-500 border-b-8 border-gray-800 transition-colors group-hover:bg-red-600"></div>
        {/* Bottom White Half */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white"></div>
        
        {/* Center Button */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white border-8 border-gray-800 rounded-full flex items-center justify-center shadow-inner z-10 transition-transform group-hover:scale-110">
          <div className="w-6 h-6 bg-gray-200 border-2 border-gray-400 rounded-full"></div>
        </div>

        {/* Text */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none drop-shadow-md">
          <h2 className="text-3xl font-black uppercase tracking-widest text-white mt-16 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '1px black' }}>
            {name}
          </h2>
        </div>
      </div>
    </Link>
  );
}
