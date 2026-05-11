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

    if (selectedPlayer?.name === pkmn.name) {
      setSelectedPlayer(null);
      setPlayerPokemon(null);
      return;
    }

    if (selectedOpponent?.name === pkmn.name) {
      setSelectedOpponent(null);
      setOpponentPokemon(null);
      return;
    }

    if (!selectedPlayer) {
      setSelectedPlayer(pkmn);
      setPlayerPokemon(pkmn);
    } else if (!selectedOpponent) {
      setSelectedOpponent(pkmn);
      setOpponentPokemon(pkmn);
    }
  };

  const startGame = () => {
    router.push('/battle');
  };

  const getRegionTheme = (region: string) => {
    switch (region.toLowerCase()) {
      case 'kanto': return 'bg-green-300';
      case 'johto': return 'bg-yellow-200';
      case 'hoenn': return 'bg-blue-300';
      case 'sinnoh': return 'bg-slate-300';
      case 'unova': return 'bg-gray-400';
      case 'kalos': return 'bg-pink-200';
      case 'alola': return 'bg-teal-200';
      case 'galar': return 'bg-red-300';
      case 'paldea': return 'bg-orange-300';
      default: return 'bg-blue-100';
    }
  };

  return (
    <div
      className={`min-h-screen ${getRegionTheme(regionName)}`}
      style={{ backgroundImage: 'radial-gradient(#00000022 2px, transparent 2px)', backgroundSize: '24px 24px' }}
    >
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <h1 className="text-2xl sm:text-4xl font-mono uppercase tracking-widest mb-8 text-center text-black" style={{ textShadow: '2px 2px 0px white' }}>{t('Region Pokedex', { region: regionName })}</h1>

        <div className="w-full">
          {loading ? (
            <div className="flex justify-center mt-12">
              <p className="text-center font-mono text-xl text-black bg-white inline-block px-8 py-3 rounded-full border-4 border-black shadow-[4px_4px_0_0_#000] animate-pulse">{t('Loading Pokedex...')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6 pb-48">
              {entries.map((entry) => {
                const urlParts = entry.pokemon_species.url.split('/');
                const id = urlParts[urlParts.length - 2];
                const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

                const isPlayer = selectedPlayer?.name === entry.pokemon_species.name;
                const isOpponent = selectedOpponent?.name === entry.pokemon_species.name;

                return (
                  <div
                    key={entry.pokemon_species.name}
                    onClick={() => handleSelect(entry)}
                    className={`relative p-3 border-4 border-black rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group ${isPlayer
                      ? 'bg-blue-100 shadow-[6px_6px_0_0_#2563eb] -translate-y-2 -translate-x-2 z-10 scale-105 ring-4 ring-blue-500'
                      : isOpponent
                        ? 'bg-red-100 shadow-[6px_6px_0_0_#dc2626] -translate-y-2 -translate-x-2 z-10 scale-105 ring-4 ring-red-500'
                        : 'bg-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex justify-center mb-3 bg-gradient-to-b from-gray-100 to-gray-200 border-2 border-black rounded-xl overflow-hidden group-hover:from-blue-50 group-hover:to-blue-100 transition-colors relative">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)]" style={{ backgroundSize: '8px 8px' }}></div>
                      <img src={spriteUrl} alt={entry.pokemon_species.name} className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md z-10 group-hover:scale-110 transition-transform" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <h3 className="text-center font-mono font-bold uppercase text-[10px] sm:text-xs text-black tracking-widest bg-gray-100 border-2 border-black rounded-full py-1 truncate px-2">{entry.pokemon_species.name}</h3>
                    {isPlayer && <span className="absolute top-2 left-2 text-[10px] font-mono font-bold uppercase bg-blue-500 text-white px-2 py-0.5 rounded-full border-2 border-black shadow-sm">P1</span>}
                    {isOpponent && <span className="absolute top-2 right-2 text-[10px] font-mono font-bold uppercase bg-red-500 text-white px-2 py-0.5 rounded-full border-2 border-black shadow-sm">P2</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Dock (Pokedex Retro Style) */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#dc0a2d] border-t-[8px] border-black shadow-[0_-8px_0_0_rgba(0,0,0,0.5)]">
        {/* Top styling line */}
        <div className="w-full h-2 bg-[#ff6b8b] border-b-4 border-black"></div>
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-[1400px]">
          <div className="flex justify-between items-center gap-2 sm:gap-6">
            
            {/* Player 1 Slot (Blue Pokedex LCD) */}
            <div 
              onClick={() => { setSelectedPlayer(null); setPlayerPokemon(null); }}
              className={`flex-1 flex items-center p-2 sm:p-4 border-[4px] sm:border-[6px] border-black rounded-xl cursor-pointer transition-all duration-300 ${selectedPlayer ? 'bg-[#1e3a8a] shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] hover:scale-[1.02]' : 'bg-[#1e3a8a] border-dashed opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}
            >
              <div className="w-16 h-16 sm:w-32 sm:h-32 bg-[#98cb98] rounded-lg flex items-center justify-center relative border-[4px] border-black shrink-0 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 opacity-10 rounded-sm bg-[linear-gradient(rgba(0,0,0,0.1)_1px,_transparent_1px)] pointer-events-none overflow-hidden" style={{ backgroundSize: '100% 4px' }}></div>
                
                {/* Poke Ball Animation Container */}
                <div key={selectedPlayer?.name || 'empty-p1'} className={`relative w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center z-10 ${selectedPlayer ? 'animate-throw-left' : ''}`}>
                  {/* Real Poke Ball Sprite - Top Half */}
                  <div className="absolute inset-0 origin-bottom" style={{ zIndex: selectedPlayer ? 10 : 20, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', animation: selectedPlayer ? 'openTop 0.3s ease-out 0.8s both' : 'none' }}>
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball top" />
                  </div>
                  {/* Real Poke Ball Sprite - Bottom Half */}
                  <div className="absolute inset-0 origin-top" style={{ zIndex: 20, clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', animation: selectedPlayer ? 'openBottom 0.3s ease-out 0.8s both' : 'none' }}>
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball bottom" />
                  </div>
                  
                  {selectedPlayer && (
                    <div className="absolute z-30" style={{ animation: 'popOut 0.4s ease-out 0.9s both', top: '10px' }}>
                      <img src={selectedPlayer.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 max-w-none object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)] animate-bounce" style={{ imageRendering: 'pixelated' }} alt="P1 Pokemon" />
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-2 sm:ml-6 flex flex-col justify-center min-w-0">
                <span className="text-white font-mono text-[10px] sm:text-sm font-bold uppercase tracking-widest bg-black px-2 py-1 rounded w-fit mb-1">Player 1</span>
                {selectedPlayer ? (
                  <span className="text-white font-mono text-sm sm:text-3xl font-bold uppercase tracking-wider truncate" style={{ textShadow: '2px 2px 0px black' }}>{selectedPlayer.name}</span>
                ) : (
                  <span className="text-blue-300 font-mono text-[10px] sm:text-lg animate-pulse">{t('Select P1')}</span>
                )}
              </div>
            </div>

            {/* VS Button */}
            <div className="shrink-0 relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#28aafd] border-4 border-black rounded-full shadow-[inset_-2px_-2px_0_0_rgba(0,0,0,0.3)] hidden sm:block">
                 <div className="w-2 h-2 bg-white rounded-full opacity-60 ml-1 mt-1"></div>
              </div>
              <button 
                disabled={!selectedPlayer || !selectedOpponent}
                onClick={startGame}
                className="px-4 py-4 sm:px-8 sm:py-8 bg-yellow-400 text-black font-mono uppercase text-lg sm:text-4xl font-black rounded-full disabled:opacity-30 disabled:grayscale transition-transform transform hover:scale-110 hover:bg-yellow-300 border-[4px] sm:border-[8px] border-black shadow-[0_6px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[6px] flex flex-col items-center justify-center w-20 h-20 sm:w-40 sm:h-40 z-10"
              >
                <span className="text-[10px] sm:text-sm mb-0 sm:mb-1 tracking-widest">{t('Battle')}</span>
                <span className="leading-none tracking-tighter" style={{ textShadow: '2px 2px 0px white' }}>VS</span>
              </button>
            </div>

            {/* Player 2 Slot (Red Pokedex LCD) */}
            <div 
              onClick={() => { setSelectedOpponent(null); setOpponentPokemon(null); }}
              className={`flex-1 flex items-center flex-row-reverse p-2 sm:p-4 border-[4px] sm:border-[6px] border-black rounded-xl cursor-pointer transition-all duration-300 ${selectedOpponent ? 'bg-[#b90020] shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] hover:scale-[1.02]' : 'bg-[#b90020] border-dashed opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}
            >
              <div className="w-16 h-16 sm:w-32 sm:h-32 bg-[#98cb98] rounded-lg flex items-center justify-center relative border-[4px] border-black shrink-0 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 opacity-10 rounded-sm bg-[linear-gradient(rgba(0,0,0,0.1)_1px,_transparent_1px)] pointer-events-none overflow-hidden" style={{ backgroundSize: '100% 4px' }}></div>
                
                {/* Poke Ball Animation Container */}
                <div key={selectedOpponent?.name || 'empty-p2'} className={`relative w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center z-10 ${selectedOpponent ? 'animate-throw-right' : ''}`}>
                  {/* Real Poke Ball Sprite - Top Half */}
                  <div className="absolute inset-0 origin-bottom" style={{ zIndex: selectedOpponent ? 10 : 20, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', animation: selectedOpponent ? 'openTop 0.3s ease-out 0.8s both' : 'none' }}>
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball top" />
                  </div>
                  {/* Real Poke Ball Sprite - Bottom Half */}
                  <div className="absolute inset-0 origin-top" style={{ zIndex: 20, clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', animation: selectedOpponent ? 'openBottom 0.3s ease-out 0.8s both' : 'none' }}>
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball bottom" />
                  </div>
                  
                  {selectedOpponent && (
                    <div className="absolute z-30" style={{ animation: 'popOut 0.4s ease-out 0.9s both', top: '10px' }}>
                      <img src={selectedOpponent.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 max-w-none object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)] animate-bounce" style={{ imageRendering: 'pixelated' }} alt="P2 Pokemon" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mr-2 sm:mr-6 flex flex-col justify-center text-right min-w-0 items-end">
                <span className="text-white font-mono text-[10px] sm:text-sm font-bold uppercase tracking-widest bg-black px-2 py-1 rounded w-fit mb-1">Player 2</span>
                {selectedOpponent ? (
                  <span className="text-white font-mono text-sm sm:text-3xl font-bold uppercase tracking-wider truncate" style={{ textShadow: '2px 2px 0px black' }}>{selectedOpponent.name}</span>
                ) : (
                  <span className="text-red-300 font-mono text-[10px] sm:text-lg animate-pulse">{t('Select P2')}</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
