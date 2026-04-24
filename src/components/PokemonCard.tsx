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
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex justify-center mb-2">
        <img
          src={pokemon.sprites.front_default}
          alt={pokemon.name}
          className="w-24 h-24 drop-shadow-md"
        />
      </div>
      <h3 className="text-center font-bold capitalize text-lg text-gray-800">{pokemon.name}</h3>
      <div className="flex justify-center gap-1 mt-2">
        {pokemon.types.map((t) => (
          <span key={t.type.name} className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold uppercase text-gray-600">
            {t.type.name}
          </span>
        ))}
      </div>
    </div>
  );
}
