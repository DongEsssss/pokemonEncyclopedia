"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { REGION_DATA } from '../constants/regionData';

export default function HomeContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const regions = Object.values(REGION_DATA);
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleExplore = () => {
    router.push(`/region/${selectedRegion.id}`);
  };

  return (
    <div className="h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col selection:bg-blue-500">
      
      {/* 백그라운드 홀로그램 효과 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(40,170,253,0.1)_0%,transparent_70%)] animate-pulse"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 transition-all duration-1000 grayscale sepia brightness-50"
          style={{ backgroundImage: `url(${selectedRegion.bgUrl})`, filter: 'blur(4px)' }}
        ></div>
      </div>

      {/* 시스템 헤더 */}
      <header className="z-50 bg-[#1a1a1a]/80 backdrop-blur-2xl border-b-[6px] border-black px-4 sm:px-8 py-3 sm:py-5 flex justify-between items-center shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 border-4 border-black rounded-2xl shadow-[4px_4px_0_0_#000] flex items-center justify-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full border-2 border-black"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-1">System Active</span>
            <h1 className="text-lg sm:text-2xl font-mono text-white uppercase font-black tracking-tighter leading-none">Pokedex Terminal</h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Protocol</span>
            <span className="text-xs font-mono text-blue-400 font-black uppercase">Neural-Link</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* 메인 스테이션 레이아웃 */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-3 sm:p-6 gap-4 sm:gap-6 relative">
        
        {/* 사이드 패널 (지역 선택) */}
        <aside className="w-full md:w-[320px] lg:w-[380px] shrink-0 flex flex-col bg-[#111]/90 backdrop-blur-md border-[6px] border-black rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-left duration-700">
          <div className="bg-[#DC0A2D] p-3 sm:p-4 border-b-[6px] border-black flex justify-between items-center">
            <span className="font-mono font-black text-xs uppercase tracking-widest text-white">Select Sector</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 bg-black/20 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-black/20 rounded-full"></div>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto md:overflow-y-auto p-3 sm:p-4 custom-scrollbar flex md:flex-col gap-3">
            {regions.map((region, idx) => (
              <button 
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                className={`min-w-[140px] md:min-w-0 w-full group relative p-4 sm:p-5 rounded-2xl border-4 transition-all duration-300 text-left overflow-hidden min-h-[80px] sm:min-h-[90px] flex flex-col justify-center ${
                  selectedRegion.id === region.id 
                    ? 'bg-blue-600 border-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : 'bg-white/5 border-black/40 hover:bg-white/10'
                }`}
              >
                <div className="relative z-10">
                  <span className={`block text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-2 ${selectedRegion.id === region.id ? 'text-blue-200' : 'text-white/30'}`}>SEC-0{idx + 1}</span>
                  <div className="flex justify-between items-center">
                    <span className={`text-lg sm:text-2xl font-mono font-black uppercase leading-none ${selectedRegion.id === region.id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                      {t(region.nameKey)}
                    </span>
                    {selectedRegion.id === region.id && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                    )}
                  </div>
                </div>
                {selectedRegion.id === region.id && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-white shadow-[0_0_15px_white]"></div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* 메인 프리뷰 패널 */}
        <section className="flex-1 flex flex-col bg-black/40 backdrop-blur-sm border-[6px] border-black rounded-[2rem] shadow-2xl relative overflow-hidden group">
          
          {/* 스캔 라인 */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <div className="w-full h-1 bg-blue-400/30 absolute top-0 animate-scan shadow-[0_0_15px_#3b82f6]"></div>
          </div>

          {/* 배경 이미지 */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10 scale-110 transition-all duration-1000 group-hover:scale-100"
            style={{ backgroundImage: `url(${selectedRegion.bgUrl})` }}
          ></div>

          <div className="relative z-20 flex-1 flex flex-col p-6 sm:p-10 lg:p-12">
            
            <div className="max-w-2xl animate-in fade-in slide-in-from-top-5 duration-700">
              <span className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-500 text-blue-400 font-mono text-[9px] font-black uppercase tracking-[0.2em] rounded-md mb-3">Sector Identified</span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-black uppercase tracking-tighter mb-4 sm:mb-6 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{t(selectedRegion.nameKey)}</h2>
              <div className="bg-black/70 border-l-4 border-blue-500 p-5 sm:p-6 rounded-r-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 font-mono text-[7px] text-white/10 uppercase tracking-widest">Feed_01</div>
                <p className="text-sm sm:text-base lg:text-lg font-sans text-white/80 leading-relaxed">
                  {t(selectedRegion.descKey)}
                </p>
              </div>
            </div>

            {/* 스타팅 포켓몬 프리뷰 */}
            <div className="mt-6 sm:mt-auto flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/30 to-transparent"></div>
                <span className="font-mono text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Native Species</span>
              </div>
              <div className="flex gap-4 sm:gap-6">
                {selectedRegion.starters.map((starterId, idx) => (
                  <div key={starterId} className="flex flex-col items-center group/starter animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden backdrop-blur-md transition-all shadow-lg group-hover/starter:border-blue-500/30">
                      <img 
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${starterId}.png`} 
                        className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain drop-shadow-lg group-hover/starter:scale-110 transition-transform duration-500"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 접속 버튼 */}
            <div className="mt-8 md:absolute md:bottom-8 md:right-8 group/btn z-50">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl group-hover/btn:bg-blue-400/30 transition-all duration-700 animate-pulse"></div>
              
              <button 
                onClick={handleExplore}
                className="relative w-full md:w-auto px-10 sm:px-12 py-4 sm:py-6 bg-[#0a1a2a]/95 backdrop-blur-xl border-4 border-blue-500/30 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)] active:scale-95 transition-all hover:border-blue-400/60 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] group/go overflow-hidden flex flex-col items-center justify-center md:min-w-[240px]"
              >
                {/* 코너 데칼 */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400/40"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400/40"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400/40"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400/40"></div>
                
                <span className="text-[9px] font-black text-blue-400/40 uppercase tracking-[0.3em] mb-1 hidden sm:block">Neural_Link</span>
                <span className="relative z-10 font-mono font-black text-xl sm:text-3xl text-white group-hover/go:scale-105 transition-transform tracking-widest drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  {t('ACCESS')}
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 시스템 푸터 */}
      <footer className="z-50 bg-[#1a1a1a] border-t-[8px] border-black px-6 sm:px-12 py-3 sm:py-4 flex justify-between items-center shrink-0">
        <div className="flex gap-6 sm:gap-10">
          <div className="flex flex-col">
            <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Core Status</span>
            <span className="text-[10px] sm:text-xs font-mono text-green-500 font-black uppercase">Synchronized</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Build</span>
            <span className="text-[10px] sm:text-xs font-mono text-white/40 font-black uppercase">v2.0.4</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden sm:block text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Neural-Link Established</p>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500/40"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scan { animation: scan 4s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
