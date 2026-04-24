"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPokedexByRegion, getPokemon, Pokemon, PokedexEntry } from '@/src/services/pokeapi';
import PokemonCard from '@/src/components/PokemonCard';
import { useBattle } from '@/src/context/BattleContext';

export default function RegionPage() {
  const params = useParams();
  const router = useRouter();
  const regionName = params.regionName as string;
  
  const [entries, setEntries] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { setPlayerPokemon, setOpponentPokemon } = useBattle();
  const [selectedPlayer, setSelectedPlayer] = useState<Pokemon | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<Pokemon | null>(null);
  const [pokemonCache, setPokemonCache] = useState<Record<string, Pokemon>>({});

  useEffect(() => {
    async function loadRegion() {
      try {
        const data = await getPokedexByRegion(regionName);
        setEntries(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRegion();
  }, [regionName]);
  
  const fetchPokemonDetails = async (name: string) => {
    if (pokemonCache[name]) return pokemonCache[name];
    const data = await getPokemon(name);
    setPokemonCache(prev => ({ ...prev, [name]: data }));
    return data;
  };

  const handleSelect = async (entry: PokedexEntry) => {
    const pkmn = await fetchPokemonDetails(entry.pokemon_species.name);
    if (!selectedPlayer) {
      setSelectedPlayer(pkmn);
      setPlayerPokemon(pkmn);
    } else if (!selectedOpponent && selectedPlayer.name !== pkmn.name) {
      setSelectedOpponent(pkmn);
      setOpponentPokemon(pkmn);
    }
  };
  
  const startGame = () => {
    router.push('/battle');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 capitalize">{regionName} Region Pokedex</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-8 sticky top-4 z-10 border border-gray-200">
        <h2 className="font-semibold text-lg mb-2">Battle Setup</h2>
        <div className="flex justify-between items-center">
          <div>
            <p>Player 1: {selectedPlayer ? <span className="font-bold capitalize text-blue-600">{selectedPlayer.name}</span> : 'Select below'}</p>
            <p>Player 2: {selectedOpponent ? <span className="font-bold capitalize text-red-600">{selectedOpponent.name}</span> : 'Select below'}</p>
          </div>
          <button 
            disabled={!selectedPlayer || !selectedOpponent}
            onClick={startGame}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition transform hover:scale-105"
          >
            Start Battle!
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading Pokedex...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {entries.map((entry) => {
            // Ideally we initially fetch all or lazy load. For simplicity we assume PokemonCard can take minimal info or we fetch on demand.
            // But we need the sprite. We will use a fallback image from raw github if it's not loaded, or fetch all.
            // Oh actually, PokeAPI has a stable URL for sprites based on ID.
            // PokedexEntry has entry_number or pokemon_species.url which has ID.
            const urlParts = entry.pokemon_species.url.split('/');
            const id = urlParts[urlParts.length - 2];
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
            
            const isPlayer = selectedPlayer?.name === entry.pokemon_species.name;
            const isOpponent = selectedOpponent?.name === entry.pokemon_species.name;
            const isSelected = isPlayer || isOpponent;
            
            return (
              <div 
                key={entry.pokemon_species.name}
                onClick={() => handleSelect(entry)}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 bg-white ${
                  isPlayer ? 'border-blue-500 bg-blue-50' : isOpponent ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-center mb-2">
                  <img src={spriteUrl} alt={entry.pokemon_species.name} className="w-20 h-20 drop-shadow-sm" />
                </div>
                <h3 className="text-center font-bold capitalize text-gray-800">{entry.pokemon_species.name}</h3>
                {isPlayer && <span className="absolute top-2 left-2 text-xs bg-blue-500 text-white px-2 rounded-full">P1</span>}
                {isOpponent && <span className="absolute top-2 right-2 text-xs bg-red-500 text-white px-2 rounded-full">P2</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
