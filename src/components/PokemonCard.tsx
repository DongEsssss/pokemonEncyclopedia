import React from 'react';
import { Pokemon } from '../services/pokeapi';

/**
 * 포켓몬 카드를 표시하는 컴포넌트입니다.
 */
interface PokemonCardProps {
  pokemon: Pokemon; // 표시할 포켓몬 객체
  isSelected?: boolean; // 선택 여부
  onSelect?: (pokemon: Pokemon) => void; // 선택 시 실행될 함수
}

export default function PokemonCard({ pokemon, isSelected, onSelect }: PokemonCardProps) {
  return (
    <div
      onClick={() => onSelect && onSelect(pokemon)}
      className={`relative p-3 rounded-none border-4 border-black transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected 
          ? 'bg-yellow-100 shadow-[4px_4px_0_0_#eab308] translate-x-[-2px] translate-y-[-2px]' 
          : 'bg-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1'
      }`}
    >
      {/* 포켓몬 이미지 영역 */}
      <div className="flex justify-center mb-2 bg-gray-100 m-1 border-4 border-black">
        <img
          src={pokemon.sprites.front_default}
          alt={pokemon.name}
          className="w-24 h-24"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      {/* 포켓몬 이름 */}
      <h3 className="text-center font-mono uppercase text-[10px] sm:text-xs text-black tracking-widest mt-2">{pokemon.name}</h3>
      {/* 포켓몬 타입 목록 */}
      <div className="flex flex-wrap justify-center gap-1 mt-3">
        {pokemon.types.map((t) => (
          <span key={t.type.name} className="px-2 py-1 bg-black text-white text-[8px] font-mono uppercase tracking-wider border-2 border-black">
            {t.type.name}
          </span>
        ))}
      </div>
    </div>
  );
}
