"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { REGION_DATA } from '../constants/regionData';

export default function HomeContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const regions = Object.values(REGION_DATA);
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);

  // 선택한 지역으로 이동하는 함수
  const handleExplore = () => {
    router.push(`/region/${selectedRegion.id}`);
  };

  return (
    <>
      {/* 동적 배경: 선택된 지역의 배경 이미지를 표시 */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center transition-all duration-1000 opacity-60"
        style={{ backgroundImage: `url(${selectedRegion.bgUrl})`, filter: 'blur(2px)' }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-80px)] font-mono">
        {/* --- 왼쪽 패널 (도감 본체) --- */}
        <div className="bg-[#DC0A2D] w-full md:w-[420px] border-[4px] border-black rounded-3xl md:rounded-r-none md:rounded-l-[2rem] shadow-[8px_12px_24px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col z-10 h-auto md:h-[650px]">
          
          {/* 상단 헤더 섹션 (큰 파란 불빛과 작은 불빛들) */}
          <div className="relative h-28 flex items-start px-6 pt-6 bg-[#DC0A2D] z-20">
            {/* 큰 파란 불빛 */}
            <div className="w-16 h-16 bg-white rounded-full border-[3px] border-black flex items-center justify-center shadow-md">
              <div className="w-12 h-12 bg-[#28AAFD] rounded-full border-2 border-black shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.5)] relative">
                <div className="absolute top-1 left-2 w-4 h-4 bg-white rounded-full opacity-80"></div>
              </div>
            </div>
            {/* 3개의 작은 불빛 (빨강, 노랑, 초록) */}
            <div className="flex space-x-2 ml-4 mt-1">
              <div className="w-4 h-4 bg-[#FF0000] border-2 border-black rounded-full shadow-sm"></div>
              <div className="w-4 h-4 bg-[#FFCC00] border-2 border-black rounded-full shadow-sm"></div>
              <div className="w-4 h-4 bg-[#32CB65] border-2 border-black rounded-full shadow-sm"></div>
            </div>
          </div>

          {/* 장식용 곡선 라인 */}
          <div className="w-full border-b-[4px] border-black absolute top-[110px] left-0"></div>

          {/* 메인 화면 베젤 */}
          <div className="mx-6 mt-8 bg-[#DEDEDE] border-[4px] border-black rounded-t-xl rounded-bl-xl rounded-br-[3rem] p-5 shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.1)] relative">
            {/* 상단 빨간 점 2개 */}
            <div className="flex justify-center gap-6 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#DC0A2D] border border-black"></div>
              <div className="w-2 h-2 rounded-full bg-[#DC0A2D] border border-black"></div>
            </div>
            
            {/* 내부 검은색 화면: 스타팅 포켓몬 표시 */}
            <div className="bg-[#232323] rounded-lg h-44 border-[4px] border-black flex flex-col items-center justify-center shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6)] relative overflow-hidden">
              <div className="flex justify-around items-end w-full px-2">
                {selectedRegion.starters.map((starterId) => (
                  <div key={starterId} className="w-20 h-20 sm:w-24 sm:h-24 relative hover:scale-110 transition-transform">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${starterId}.png`} 
                      alt={`Starter ${starterId}`}
                      className="w-full h-full object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 베젤 하단 요소들 */}
            <div className="flex justify-between items-center mt-4 px-2">
              <div className="w-5 h-5 rounded-full bg-[#DC0A2D] border-2 border-black"></div>
              <div className="flex flex-col space-y-1">
                <div className="w-8 h-1 bg-black"></div>
                <div className="w-8 h-1 bg-black"></div>
                <div className="w-8 h-1 bg-black"></div>
                <div className="w-8 h-1 bg-black"></div>
              </div>
            </div>
          </div>

          {/* 화면 아래 조작부 */}
          <div className="mx-6 mt-6 flex justify-between items-start mb-6 md:mb-0">
            {/* 검은색 원형 버튼: 지역 탐색 시작 */}
            <button 
              onClick={handleExplore}
              className="w-10 h-10 bg-[#232323] rounded-full border-[3px] border-black shadow-[2px_2px_0_rgba(0,0,0,0.3)] mt-2 hover:bg-gray-800 active:scale-95 transition-transform"
              aria-label="Explore Region"
            ></button>
            
            {/* 중앙 버튼들 및 초록색 상태 화면 */}
            <div className="flex flex-col items-center ml-4">
              <div className="flex gap-4 mb-3">
                <div className="w-10 h-2 bg-[#DC0A2D] border-[2px] border-black rounded-full shadow-[1px_1px_0_rgba(0,0,0,0.3)]"></div>
                <div className="w-10 h-2 bg-[#28AAFD] border-[2px] border-black rounded-full shadow-[1px_1px_0_rgba(0,0,0,0.3)]"></div>
              </div>
              <div className="bg-[#51AE5F] border-[3px] border-black rounded-md w-28 h-12 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center text-black font-bold uppercase tracking-wider text-sm">
                {t(selectedRegion.nameKey)}
              </div>
            </div>
            
            {/* 십자키 (D-Pad) */}
            <div className="relative w-24 h-24 mr-2">
              <button className="absolute top-8 left-0 w-24 h-8 bg-[#232323] border-[3px] border-black rounded hover:bg-gray-800 active:scale-95"></button>
              <button className="absolute top-0 left-8 w-8 h-24 bg-[#232323] border-[3px] border-black rounded hover:bg-gray-800 active:scale-95"></button>
              {/* 테두리를 덮기 위한 중앙 블록 */}
              <div className="absolute top-9 left-9 w-6 h-6 bg-[#232323] z-10 pointer-events-none"></div>
              {/* 중앙 홈 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-800 rounded-full z-20 opacity-50 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* --- 중간 경첩 (Hinge) --- */}
        <div className="hidden md:flex flex-col justify-between items-center w-12 h-[580px] bg-[#B00824] border-y-[4px] border-black shadow-[inset_4px_0_8px_rgba(0,0,0,0.4)] z-0">
          <div className="w-full h-8 border-b-[4px] border-black opacity-60"></div>
          <div className="w-full h-8 border-b-[4px] border-black opacity-60"></div>
          <div className="w-full h-8 border-b-[4px] border-black opacity-60 mt-auto mb-10"></div>
        </div>

        {/* --- 오른쪽 패널 (덮개 부분) --- */}
        <div className="bg-[#DC0A2D] w-full md:w-[420px] border-[4px] border-black rounded-3xl md:rounded-l-none md:rounded-r-[2rem] shadow-[8px_12px_24px_rgba(0,0,0,0.5)] p-6 flex flex-col z-10 h-auto md:h-[550px] mt-4 md:mt-[100px]">
          
          {/* 상단 검은색 화면 (지역 설명) */}
          <div className="bg-[#232323] border-[4px] border-black rounded-lg h-36 p-4 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6)] mb-6">
            <p className="text-[#42F554] text-xs sm:text-sm leading-relaxed overflow-y-auto h-full pr-2 custom-scrollbar drop-shadow-[0_0_2px_#42F554]">
              {t(selectedRegion.descKey)}
            </p>
          </div>

          {/* 10개의 파란색 버튼 그리드 (지역 선택기) */}
          <div className="grid grid-cols-5 gap-[2px] bg-black border-2 border-black p-[2px] rounded mb-8 shadow-md">
            {regions.map((region) => (
              <button 
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                title={t(region.nameKey)}
                className={`h-12 sm:h-14 transition-all flex items-center justify-center text-[10px] sm:text-xs font-bold text-black uppercase overflow-hidden rounded-sm ${
                  selectedRegion.id === region.id 
                    ? 'bg-[#5CE1E6] z-10 scale-105 shadow-[0_0_8px_#5CE1E6] ring-2 ring-white' 
                    : 'bg-[#28AAFD] hover:bg-[#5CE1E6]'
                }`}
              >
                {t(region.nameKey).substring(0, 4)}
              </button>
            ))}
            {/* 10번째 버튼 (장식용 빈 칸) */}
            <div className="h-12 sm:h-14 bg-[#28AAFD] flex items-center justify-center rounded-sm">
              <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
            </div>
          </div>

          {/* 하단 액션 버튼 섹션 */}
          <div className="flex flex-col gap-4 mt-auto">
            {/* 상단: 흰색 버튼 2개 */}
            <div className="flex justify-end gap-3">
              <button className="w-12 h-3 bg-white border-[2px] border-black rounded-sm shadow-[1px_1px_0_rgba(0,0,0,0.3)] hover:bg-gray-200 active:translate-y-1 active:shadow-none"></button>
              <button className="w-12 h-3 bg-white border-[2px] border-black rounded-sm shadow-[1px_1px_0_rgba(0,0,0,0.3)] hover:bg-gray-200 active:translate-y-1 active:shadow-none"></button>
            </div>

            {/* 하단: 긴 검은색 버튼 2개 + 노란색 GO 버튼 */}
            <div className="flex justify-between items-end">
              <div className="flex gap-4">
                <button className="w-24 h-4 bg-[#232323] border-[2px] border-black rounded-sm shadow-[1px_1px_0_rgba(0,0,0,0.3)] hover:bg-gray-700 active:translate-y-1 active:shadow-none"></button>
                <button className="w-24 h-4 bg-[#232323] border-[2px] border-black rounded-sm shadow-[1px_1px_0_rgba(0,0,0,0.3)] hover:bg-gray-700 active:translate-y-1 active:shadow-none"></button>
              </div>
              
              {/* 노란색 버튼: 지역 탐색 시작 */}
              <button 
                onClick={handleExplore}
                className="w-12 h-12 bg-[#FFCC00] rounded-full border-[3px] border-black shadow-[2px_2px_0_rgba(0,0,0,0.3)] hover:bg-yellow-300 active:translate-y-1 active:shadow-none flex items-center justify-center font-bold text-xs transform hover:scale-110 transition-transform cursor-pointer group"
              >
                <span className="group-hover:animate-pulse">GO</span>
              </button>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
