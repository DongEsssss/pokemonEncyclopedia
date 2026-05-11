"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPokedexByRegion, getPokemon, Pokemon, PokedexEntry, getRandomMoves, MoveDetails, getMovesDetails, PokemonMove, PokemonSpecies, getPokemonSpecies } from '@/src/services/pokeapi';
import PokemonCard from '@/src/components/PokemonCard';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';

const typeColors: Record<string, string> = {
  normal: 'bg-gray-400', fire: 'bg-red-500', water: 'bg-blue-500', grass: 'bg-green-500',
  electric: 'bg-yellow-400 text-gray-900', ice: 'bg-cyan-300 text-gray-900', fighting: 'bg-orange-700',
  poison: 'bg-purple-500', ground: 'bg-yellow-600', flying: 'bg-indigo-300 text-gray-900',
  psychic: 'bg-pink-500', bug: 'bg-lime-500 text-gray-900', rock: 'bg-yellow-800',
  ghost: 'bg-indigo-800', dragon: 'bg-indigo-600', dark: 'bg-gray-800',
  steel: 'bg-gray-500', fairy: 'bg-pink-300 text-gray-900'
};

export default function RegionPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const regionName = params.regionName as string;

  const [entries, setEntries] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { setPlayerPokemon, setOpponentPokemon, playerMoves, opponentMoves, setPlayerMoves, setOpponentMoves } = useBattle();
  const [selectedPlayer, setSelectedPlayer] = useState<Pokemon | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<Pokemon | null>(null);
  const [playerSpecies, setPlayerSpecies] = useState<PokemonSpecies | null>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<PokemonSpecies | null>(null);
  const [pokemonCache, setPokemonCache] = useState<Record<string, Pokemon>>({});
  const [speciesCache, setSpeciesCache] = useState<Record<string, PokemonSpecies>>({});

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [tempSelectedMoves, setTempSelectedMoves] = useState<MoveDetails[]>([]);
  const [availableMovesDetails, setAvailableMovesDetails] = useState<MoveDetails[]>([]);
  const [isLoadingAvailableMoves, setIsLoadingAvailableMoves] = useState(false);
  const [isFetchingMoves, setIsFetchingMoves] = useState(false);
  const [playerPokedexTab, setPlayerPokedexTab] = useState<'info' | 'moves'>('info');
  const [opponentPokedexTab, setOpponentPokedexTab] = useState<'info' | 'moves'>('moves'); // Show moves by default for variety or just info? Let's do info.

  const getLocalizedMoveName = (move: MoveDetails) => {
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const nameObj = move.names.find(n => n.language.name === lang) || move.names.find(n => n.language.name === 'en');
    return nameObj ? nameObj.name : move.name;
  };

  const getLocalizedMoveDescription = (move: MoveDetails) => {
    if (!move.flavor_text_entries) return '';
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const descObj = move.flavor_text_entries.find(f => f.language.name === lang) || move.flavor_text_entries.find(f => f.language.name === 'en');
    return descObj ? descObj.flavor_text.replace(/[\n\f\r]/g, ' ') : '';
  };

  const getLocalizedPokemonName = (species: PokemonSpecies | null, defaultName: string) => {
    if (!species) return defaultName;
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const nameObj = species.names.find(n => n.language.name === lang) || species.names.find(n => n.language.name === 'en');
    return nameObj ? nameObj.name : defaultName;
  };

  const getLocalizedPokemonDescription = (species: PokemonSpecies | null) => {
    if (!species) return '';
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const descObj = species.flavor_text_entries.find(f => f.language.name === lang) || species.flavor_text_entries.find(f => f.language.name === 'en');
    return descObj ? descObj.flavor_text.replace(/[\n\f\r]/g, ' ') : '';
  };

  const openMoveEditModal = async (playerType: 'player1' | 'player2') => {
    setEditingPlayer(playerType);
    const pkmn = playerType === 'player1' ? selectedPlayer : selectedOpponent;
    const currentMoves = playerType === 'player1' ? playerMoves : opponentMoves;
    if (pkmn) {
      setTempSelectedMoves([...currentMoves]);
      setIsMoveModalOpen(true);
      setIsLoadingAvailableMoves(true);
      try {
        const urls = pkmn.moves.map(m => m.move.url);
        const allDetails = await getMovesDetails(urls);
        setAvailableMovesDetails(allDetails);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingAvailableMoves(false);
      }
    } else {
      setTempSelectedMoves([]);
    }
  };

  const toggleTempMove = (move: MoveDetails) => {
    setTempSelectedMoves(prev => {
      const exists = prev.find(m => m.name === move.name);
      if (exists) {
        return prev.filter(m => m.name !== move.name);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, move];
    });
  };

  const confirmMoveSelection = async () => {
    if (tempSelectedMoves.length !== 4 || !editingPlayer) return;
    setIsFetchingMoves(true);
    try {
      if (editingPlayer === 'player1') {
        setPlayerMoves([...tempSelectedMoves]);
      } else {
        setOpponentMoves([...tempSelectedMoves]);
      }
      setIsMoveModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMoves(false);
    }
  };

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

  const fetchSpeciesDetails = async (name: string) => {
    if (speciesCache[name]) return speciesCache[name];
    const data = await getPokemonSpecies(name);
    setSpeciesCache(prev => ({ ...prev, [name]: data }));
    return data;
  };

  const handleSelect = async (entry: PokedexEntry) => {
    const pkmn = await fetchPokemonDetails(entry.pokemon_species.name);
    const species = await fetchSpeciesDetails(entry.pokemon_species.name);

    if (selectedPlayer?.name === pkmn.name) {
      setSelectedPlayer(null);
      setPlayerPokemon(null);
      setPlayerSpecies(null);
      setPlayerMoves([]);
      return;
    }

    if (selectedOpponent?.name === pkmn.name) {
      setSelectedOpponent(null);
      setOpponentPokemon(null);
      setOpponentSpecies(null);
      setOpponentMoves([]);
      return;
    }

    if (!selectedPlayer) {
      setSelectedPlayer(pkmn);
      setPlayerPokemon(pkmn);
      setPlayerSpecies(species);
      setPlayerMoves([]);
      getRandomMoves(pkmn.moves, 4).then(setPlayerMoves);
    } else if (!selectedOpponent) {
      setSelectedOpponent(pkmn);
      setOpponentPokemon(pkmn);
      setOpponentSpecies(species);
      setOpponentMoves([]);
      getRandomMoves(pkmn.moves, 4).then(setOpponentMoves);
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
              className={`flex-1 flex items-center p-2 sm:p-4 border-[4px] sm:border-[6px] border-black rounded-xl cursor-pointer transition-all duration-300 relative ${selectedPlayer ? 'bg-[#1e3a8a] shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] hover:scale-[1.02]' : 'bg-[#1e3a8a] border-dashed opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}
            >
              {/* P1 Pokedex Info Popup */}
              {selectedPlayer && (
                <div className="absolute bottom-full left-0 mb-4 sm:mb-8 w-[320px] sm:w-[420px] z-[100] cursor-default" onClick={e => e.stopPropagation()}>
                  {/* Pokedex Frame */}
                  <div className="bg-[#dc0a2d] border-[6px] border-black rounded-2xl shadow-[10px_10px_0_0_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Top Detail */}
                    <div className="h-10 bg-[#dc0a2d] border-b-4 border-black flex items-center px-4 gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
                      <div className="flex gap-1 flex-1">
                        <div className="w-2 h-2 rounded-full bg-red-600 border border-black/30"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400 border border-black/30"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500 border border-black/30"></div>
                      </div>
                      <div className="flex bg-black/20 p-1 rounded-lg gap-1">
                        <button 
                          onClick={() => setPlayerPokedexTab('info')}
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold rounded ${playerPokedexTab === 'info' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                          Info
                        </button>
                        <button 
                          onClick={() => setPlayerPokedexTab('moves')}
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold rounded ${playerPokedexTab === 'moves' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                          Moves
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#dc0a2d]">
                      {playerPokedexTab === 'info' ? (
                        <>
                          {/* Main Screen (Sprite & Name) */}
                          <div className="bg-[#dedede] border-[4px] border-black rounded-xl p-2 mb-4 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.2)]">
                             <div className="bg-[#98cb98] border-2 border-black rounded p-3 flex flex-col items-center min-h-[160px] relative">
                                <div className="absolute top-1 right-2 text-[10px] font-mono text-black/60 font-bold">No.{String(selectedPlayer.id).padStart(3, '0')}</div>
                                <img src={selectedPlayer.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                <h2 className="font-mono text-black uppercase font-black text-lg sm:text-xl tracking-tighter mt-1 bg-black/10 px-4 rounded-full">
                                   {getLocalizedPokemonName(playerSpecies, selectedPlayer.name)}
                                </h2>
                             </div>
                          </div>

                          {/* Info & Stats */}
                          <div className="grid grid-cols-1 gap-3">
                             {/* Description Area */}
                             <div className="bg-[#303030] border-2 border-black p-3 rounded-lg shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.5)]">
                                <p className="font-mono text-[10px] sm:text-[11px] text-green-400 leading-tight">
                                   {getLocalizedPokemonDescription(playerSpecies)}
                                </p>
                             </div>

                             {/* Physical Data & Stats */}
                             <div className="flex gap-3">
                                <div className="flex-1 bg-[#28aafd] border-2 border-black p-2 rounded text-black font-mono text-[9px] sm:text-[10px]">
                                   <div className="flex justify-between border-b border-black/20 mb-1">
                                      <span>HT</span>
                                      <span className="font-bold">{selectedPlayer.height / 10}m</span>
                                   </div>
                                   <div className="flex justify-between">
                                      <span>WT</span>
                                      <span className="font-bold">{selectedPlayer.weight / 10}kg</span>
                                   </div>
                                </div>
                                <div className="flex-[2] bg-white border-2 border-black p-2 rounded grid grid-cols-2 gap-x-2 gap-y-0.5">
                                   {selectedPlayer.stats.map(s => (
                                      <div key={s.stat.name} className="flex justify-between items-center text-[8px] font-mono leading-none">
                                         <span className="uppercase text-gray-400 scale-[0.9] origin-left">{s.stat.name.substring(0,3)}</span>
                                         <span className="font-bold">{s.base_stat}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-[#dedede] border-[4px] border-black rounded-xl p-3 min-h-[320px] flex flex-col">
                           <div className="flex justify-between items-center mb-3">
                              <h3 className="font-mono text-black uppercase font-black text-sm">{t('Moveset')}</h3>
                              <button 
                                onClick={(e) => { e.stopPropagation(); openMoveEditModal('player1'); }}
                                className="px-2 py-0.5 bg-yellow-400 border-2 border-black font-mono text-[9px] font-bold uppercase shadow-[2px_2px_0_0_#000] active:shadow-none"
                              >
                                {t('Edit')}
                              </button>
                           </div>
                           {playerMoves.length > 0 ? (
                             <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                               {playerMoves.map(m => (
                                 <div key={m.id} className={`p-2 rounded text-white font-mono border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex flex-col gap-1 ${typeColors[m.type.name] || 'bg-gray-400'}`}>
                                   <div className="flex justify-between items-start w-full gap-2 leading-none">
                                     <span className="text-[10px] sm:text-xs uppercase font-bold truncate" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>{getLocalizedMoveName(m)}</span>
                                     <span className="text-[8px] bg-black/40 px-1 rounded uppercase tracking-wider">{m.type.name}</span>
                                   </div>
                                   <div className="flex gap-2 text-[8px] opacity-90 leading-none">
                                     <span>PWR: {m.power || '--'}</span>
                                     <span>ACC: {m.accuracy || '--'}</span>
                                   </div>
                                   <p className="text-[8px] sm:text-[9px] leading-tight line-clamp-2 border-t border-white/20 pt-1 mt-1">{getLocalizedMoveDescription(m)}</p>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="flex-1 flex items-center justify-center font-mono text-black/40 text-xs animate-pulse">
                               {t('Loading moves...')}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom Detail */}
                    <div className="h-12 bg-[#dc0a2d] border-t-4 border-black flex justify-between items-center px-4">
                       <div className="w-8 h-8 rounded-full bg-black/20 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.2)]"></div>
                       <div className="flex gap-4">
                          <div className="w-10 h-2 bg-black/40 rounded border border-black shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.5)]"></div>
                          <div className="w-10 h-2 bg-black/40 rounded border border-black shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.5)]"></div>
                       </div>
                    </div>
                  </div>
                  {/* Arrow Pointing Down */}
                  <div className="absolute -bottom-4 left-10 w-8 h-8 bg-[#dc0a2d] border-r-4 border-b-4 border-black rotate-45 transform"></div>
                </div>
              )}

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
                    <div className="absolute z-30" style={{ animation: 'popOut 0.4s ease-out 0.9s both', top: '-10px' }}>
                      <img src={selectedPlayer.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 max-w-none object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)] animate-bounce" style={{ imageRendering: 'pixelated' }} alt="P1 Pokemon" />
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-2 sm:ml-6 flex flex-col justify-center min-w-0">
                <span className="text-white font-mono text-[10px] sm:text-sm font-bold uppercase tracking-widest bg-black px-2 py-1 rounded w-fit mb-1">Player 1</span>
                {selectedPlayer ? (
                  <span className="text-white font-mono text-sm sm:text-3xl font-bold uppercase tracking-wider truncate" style={{ textShadow: '2px 2px 0px black' }}>
                    {getLocalizedPokemonName(playerSpecies, selectedPlayer.name)}
                  </span>
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
              className={`flex-1 flex items-center flex-row-reverse p-2 sm:p-4 border-[4px] sm:border-[6px] border-black rounded-xl cursor-pointer transition-all duration-300 relative ${selectedOpponent ? 'bg-[#b90020] shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] hover:scale-[1.02]' : 'bg-[#b90020] border-dashed opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}
            >
              {/* P2 Pokedex Info Popup */}
              {selectedOpponent && (
                <div className="absolute bottom-full right-0 mb-4 sm:mb-8 w-[320px] sm:w-[420px] z-[100] cursor-default" onClick={e => e.stopPropagation()}>
                  {/* Pokedex Frame */}
                  <div className="bg-[#dc0a2d] border-[6px] border-black rounded-2xl shadow-[10px_10px_0_0_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Top Detail */}
                    <div className="h-10 bg-[#dc0a2d] border-b-4 border-black flex flex-row-reverse items-center px-4 gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
                      <div className="flex gap-1 flex-1">
                        <div className="w-2 h-2 rounded-full bg-red-600 border border-black/30"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400 border border-black/30"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500 border border-black/30"></div>
                      </div>
                      <div className="flex bg-black/20 p-1 rounded-lg gap-1">
                        <button 
                          onClick={() => setOpponentPokedexTab('info')}
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold rounded ${opponentPokedexTab === 'info' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                          Info
                        </button>
                        <button 
                          onClick={() => setOpponentPokedexTab('moves')}
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold rounded ${opponentPokedexTab === 'moves' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                          Moves
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#dc0a2d]">
                      {opponentPokedexTab === 'info' ? (
                        <>
                          {/* Main Screen (Sprite & Name) */}
                          <div className="bg-[#dedede] border-[4px] border-black rounded-xl p-2 mb-4 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.2)]">
                             <div className="bg-[#98cb98] border-2 border-black rounded p-3 flex flex-col items-center min-h-[160px] relative">
                                <div className="absolute top-1 left-2 text-[10px] font-mono text-black/60 font-bold">No.{String(selectedOpponent.id).padStart(3, '0')}</div>
                                <img src={selectedOpponent.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                <h2 className="font-mono text-black uppercase font-black text-lg sm:text-xl tracking-tighter mt-1 bg-black/10 px-4 rounded-full">
                                   {getLocalizedPokemonName(opponentSpecies, selectedOpponent.name)}
                                </h2>
                             </div>
                          </div>

                          {/* Info & Stats */}
                          <div className="grid grid-cols-1 gap-3 text-right">
                             {/* Description Area */}
                             <div className="bg-[#303030] border-2 border-black p-3 rounded-lg shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.5)]">
                                <p className="font-mono text-[10px] sm:text-[11px] text-green-400 leading-tight">
                                   {getLocalizedPokemonDescription(opponentSpecies)}
                                </p>
                             </div>

                             {/* Physical Data & Stats */}
                             <div className="flex flex-row-reverse gap-3">
                                <div className="flex-1 bg-[#28aafd] border-2 border-black p-2 rounded text-black font-mono text-[9px] sm:text-[10px] text-left">
                                   <div className="flex justify-between border-b border-black/20 mb-1">
                                      <span>HT</span>
                                      <span className="font-bold">{selectedOpponent.height / 10}m</span>
                                   </div>
                                   <div className="flex justify-between">
                                      <span>WT</span>
                                      <span className="font-bold">{selectedOpponent.weight / 10}kg</span>
                                   </div>
                                </div>
                                <div className="flex-[2] bg-white border-2 border-black p-2 rounded grid grid-cols-2 gap-x-2 gap-y-0.5 text-left">
                                   {selectedOpponent.stats.map(s => (
                                      <div key={s.stat.name} className="flex justify-between items-center text-[8px] font-mono leading-none">
                                         <span className="uppercase text-gray-400 scale-[0.9] origin-left">{s.stat.name.substring(0,3)}</span>
                                         <span className="font-bold">{s.base_stat}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-[#dedede] border-[4px] border-black rounded-xl p-3 min-h-[320px] flex flex-col">
                           <div className="flex justify-between items-center mb-3">
                              <h3 className="font-mono text-black uppercase font-black text-sm">{t('Moveset')}</h3>
                              <button 
                                onClick={(e) => { e.stopPropagation(); openMoveEditModal('player2'); }}
                                className="px-2 py-0.5 bg-yellow-400 border-2 border-black font-mono text-[9px] font-bold uppercase shadow-[2px_2px_0_0_#000] active:shadow-none"
                              >
                                {t('Edit')}
                              </button>
                           </div>
                           {opponentMoves.length > 0 ? (
                             <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                               {opponentMoves.map(m => (
                                 <div key={m.id} className={`p-2 rounded text-white font-mono border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex flex-col gap-1 text-left ${typeColors[m.type.name] || 'bg-gray-400'}`}>
                                   <div className="flex justify-between items-start w-full gap-2 leading-none">
                                     <span className="text-[10px] sm:text-xs uppercase font-bold truncate" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>{getLocalizedMoveName(m)}</span>
                                     <span className="text-[8px] bg-black/40 px-1 rounded uppercase tracking-wider">{m.type.name}</span>
                                   </div>
                                   <div className="flex gap-2 text-[8px] opacity-90 leading-none">
                                     <span>PWR: {m.power || '--'}</span>
                                     <span>ACC: {m.accuracy || '--'}</span>
                                   </div>
                                   <p className="text-[8px] sm:text-[9px] leading-tight line-clamp-2 border-t border-white/20 pt-1 mt-1">{getLocalizedMoveDescription(m)}</p>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="flex-1 flex items-center justify-center font-mono text-black/40 text-xs animate-pulse">
                               {t('Loading moves...')}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom Detail */}
                    <div className="h-12 bg-[#dc0a2d] border-t-4 border-black flex flex-row-reverse justify-between items-center px-4">
                       <div className="w-8 h-8 rounded-full bg-black/20 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.2)]"></div>
                       <div className="flex gap-4">
                          <div className="w-10 h-2 bg-black/40 rounded border border-black shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.5)]"></div>
                          <div className="w-10 h-2 bg-black/40 rounded border border-black shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.5)]"></div>
                       </div>
                    </div>
                  </div>
                  {/* Arrow Pointing Down */}
                  <div className="absolute -bottom-4 right-10 w-8 h-8 bg-[#dc0a2d] border-l-4 border-b-4 border-black -rotate-45 transform"></div>
                </div>
              )}

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
                    <div className="absolute z-30" style={{ animation: 'popOut 0.4s ease-out 0.9s both', top: '-15px' }}>
                      <img src={selectedOpponent.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 max-w-none object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)] animate-bounce" style={{ imageRendering: 'pixelated' }} alt="P2 Pokemon" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mr-2 sm:mr-6 flex flex-col justify-center text-right min-w-0 items-end">
                <span className="text-white font-mono text-[10px] sm:text-sm font-bold uppercase tracking-widest bg-black px-2 py-1 rounded w-fit mb-1">Player 2</span>
                {selectedOpponent ? (
                  <span className="text-white font-mono text-sm sm:text-3xl font-bold uppercase tracking-wider truncate" style={{ textShadow: '2px 2px 0px black' }}>
                    {getLocalizedPokemonName(opponentSpecies, selectedOpponent.name)}
                  </span>
                ) : (
                  <span className="text-red-300 font-mono text-[10px] sm:text-lg animate-pulse">{t('Select P2')}</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Move Selection Modal */}
      {isMoveModalOpen && editingPlayer && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-[8px] border-black rounded-2xl p-4 sm:p-8 w-full max-w-3xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-3xl font-mono uppercase font-black text-black" style={{ textShadow: '2px 2px 0px #facc15' }}>
                {t('Select 4 Moves')}
              </h2>
              <button onClick={() => setIsMoveModalOpen(false)} className="text-black font-black text-2xl hover:text-red-600">&times;</button>
            </div>
            
            <div className="mb-4 bg-gray-100 p-4 border-4 border-black rounded">
              <div className="text-sm font-mono uppercase font-bold mb-2 flex justify-between">
                <span>{t('Selected Moves')}:</span>
                <span className={tempSelectedMoves.length === 4 ? 'text-green-600' : 'text-red-600'}>{tempSelectedMoves.length} / 4</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tempSelectedMoves.length > 0 ? tempSelectedMoves.map(m => (
                  <div key={m.id} className="px-2 py-1 bg-black text-white font-mono text-xs uppercase rounded flex items-center gap-2">
                    {getLocalizedMoveName(m)}
                    <button onClick={() => toggleTempMove(m)} className="text-red-400 hover:text-red-200 font-bold">&times;</button>
                  </div>
                )) : <span className="text-gray-400 text-xs font-mono italic">{t('No moves selected')}</span>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border-4 border-black p-2 sm:p-4 bg-white grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 relative min-h-[200px]">
              {isLoadingAvailableMoves ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 font-mono text-xl animate-pulse font-bold">
                  {t('Loading moves...')}
                </div>
              ) : null}
              {[...availableMovesDetails].sort((a, b) => {
                const aSelected = tempSelectedMoves.some(sm => sm.name === a.name);
                const bSelected = tempSelectedMoves.some(sm => sm.name === b.name);
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
              }).map((m, idx) => {
                const isSelected = tempSelectedMoves.some(sm => sm.name === m.name);
                return (
                  <button
                    key={`${m.name}-${idx}`}
                    onClick={() => toggleTempMove(m)}
                    className={`p-2 border-2 border-black font-mono flex flex-col gap-1 transition-all text-left ${isSelected ? 'bg-green-400 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.2)] scale-95' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                  >
                    <div className="flex justify-between items-start w-full gap-1">
                      <span className="text-[10px] sm:text-xs uppercase font-bold break-words flex-1 leading-tight">{getLocalizedMoveName(m)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[8px] text-white px-1.5 py-0.5 rounded uppercase shrink-0 ${typeColors[m.type.name] || 'bg-gray-400'}`}>{m.type.name}</span>
                    </div>
                    <div className="flex gap-2 text-[8px] sm:text-[9px] opacity-80 mt-auto pt-1">
                      <span>PWR: {m.power || '--'}</span>
                      <span>ACC: {m.accuracy || '--'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button 
                onClick={() => setIsMoveModalOpen(false)}
                className="px-6 py-2 bg-gray-300 border-4 border-black font-mono uppercase font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] hover:bg-gray-400"
              >
                {t('Cancel')}
              </button>
              <button 
                onClick={confirmMoveSelection}
                disabled={tempSelectedMoves.length !== 4 || isFetchingMoves}
                className="px-6 py-2 bg-yellow-400 border-4 border-black font-mono uppercase font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] hover:bg-yellow-300 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-2"
              >
                {isFetchingMoves ? <span className="animate-spin inline-block">↻</span> : null}
                {t('Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
