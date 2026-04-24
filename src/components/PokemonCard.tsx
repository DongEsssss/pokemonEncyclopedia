import React from 'react';
import { Pokemon } from '../services/pokeapi';

interface PokemonCardProps {
  pokemon: Pokemon;
  isSelected?: boolean;
  onSelect?: (pokemon: Pokemon) => void;
}

export default function PokemonCard({ pokemon, isSelected, onSelect }: PokemonCardProps) {
  return (
    <div
      onClick={() => onSelect && onSelect(pokemon)}
      className={`relative p-3 rounded-2xl border-4 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected 
          ? 'border-yellow-400 bg-gradient-to-br from-blue-100 to-blue-300 shadow-[0_0_15px_rgba(250,204,21,0.6)] transform scale-105' 
          : 'border-gray-300 bg-gradient-to-br from-white to-gray-100 hover:border-blue-400 hover:shadow-xl hover:-translate-y-2'
      }`}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 pointer-events-none"></div>
      
      <div className="flex justify-center mb-2 bg-white bg-opacity-50 rounded-xl m-1 border-2 border-gray-200">
        <img
          src={pokemon.sprites.front_default}
          alt={pokemon.name}
          className="w-24 h-24 drop-shadow-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <h3 className="text-center font-black capitalize text-lg text-gray-800 drop-shadow-sm tracking-wide">{pokemon.name}</h3>
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {pokemon.types.map((t) => (
          <span key={t.type.name} className="px-2 py-1 bg-gray-800 text-white rounded shadow-sm text-[10px] font-bold uppercase tracking-wider">
            {t.type.name}
          </span>
        ))}
      </div>
    </div>
  );
}
