"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPokedexByRegion, getPokemon, Pokemon, PokedexEntry } from '@/src/services/pokeapi';
import PokemonCard from '@/src/components/PokemonCard';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';

export default function RegionPage() {
  const { t } = useTranslation();
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
      <h1 className="text-4xl font-black mb-8 capitalize text-center text-gray-800 drop-shadow-sm">{t('Region Pokedex', { region: regionName })}</h1>
      
      <div className="bg-red-600 p-2 rounded-2xl shadow-2xl mb-8 sticky top-4 z-50 border-4 border-gray-800">
        <div className="bg-gray-900 p-4 rounded-xl border-4 border-gray-700 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1 w-full">
            <h2 className="font-mono text-xl mb-3 text-yellow-400 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
              {t('Battle Setup')}
            </h2>
            <div className="grid grid-cols-2 gap-4 bg-gray-800 p-3 rounded-lg border-2 border-gray-600 font-mono text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1">{t('Player 1')}</span>
                {selectedPlayer ? <span className="font-bold capitalize text-blue-400 text-lg">{selectedPlayer.name}</span> : <span className="text-gray-500">{t('Select below')}</span>}
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1">{t('Player 2')}</span>
                {selectedOpponent ? <span className="font-bold capitalize text-red-400 text-lg">{selectedOpponent.name}</span> : <span className="text-gray-500">{t('Select below')}</span>}
              </div>
            </div>
          </div>
          <button 
            disabled={!selectedPlayer || !selectedOpponent}
            onClick={startGame}
            className="w-full md:w-auto px-8 py-4 bg-yellow-400 text-gray-900 font-black text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition-transform transform hover:scale-105 border-4 border-gray-800 shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
          >
            {t('Start Battle!')}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">{t('Loading Pokedex...')}</p>
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
                className={`relative p-3 rounded-2xl border-4 transition-all duration-300 cursor-pointer overflow-hidden group ${
                  isPlayer 
                    ? 'border-blue-500 bg-blue-50 shadow-[0_0_15px_rgba(59,130,246,0.5)] transform scale-105 z-10' 
                    : isOpponent 
                      ? 'border-red-500 bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.5)] transform scale-105 z-10' 
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-xl hover:-translate-y-2'
                }`}
              >
                <div className="flex justify-center mb-2 bg-gray-100 rounded-xl m-1 border-2 border-gray-200 group-hover:bg-blue-50 transition-colors">
                  <img src={spriteUrl} alt={entry.pokemon_species.name} className="w-20 h-20 drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                </div>
                <h3 className="text-center font-black capitalize text-gray-800 tracking-wide text-sm">{entry.pokemon_species.name}</h3>
                {isPlayer && <span className="absolute top-2 left-2 text-[10px] font-black bg-blue-500 text-white px-2 py-1 rounded shadow-md border border-blue-700">P1</span>}
                {isOpponent && <span className="absolute top-2 right-2 text-[10px] font-black bg-red-500 text-white px-2 py-1 rounded shadow-md border border-red-700">P2</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
