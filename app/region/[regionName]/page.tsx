'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { typeThemes } from '@/src/constants/pokemon';
import { matchChosung } from '@/src/utils/searchUtils';
import PokedexSidePanel from '@/src/components/PokedexSidePanel';
import MoveEditModal from '@/src/components/MoveEditModal';
import { getRandomMoves } from '@/src/services/pokeapi';

import { useBattle } from '@/src/context/BattleContext';

interface PokemonSpecies {
  name: string;
  url: string;
}

interface PokedexEntry {
  entry_number: number;
  pokemon_species: PokemonSpecies;
}

const REGION_BG_MAP: Record<string, string> = {
  kanto: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=2070',
  johto: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2069',
  hoenn: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2070',
  sinnoh: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070',
  unova: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=2013',
  kalos: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=2073',
  alola: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2073',
  galar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070'
};

export default function RegionPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const regionName = (params.regionName as string).toLowerCase();

  const { 
    setPlayerPokemon: setContextPlayerPokemon, 
    setOpponentPokemon: setContextOpponentPokemon, 
    setPlayerMoves: setContextPlayerMoves, 
    setOpponentMoves: setContextOpponentMoves,
    battleMode, setBattleMode,
    isTournament, setIsTournament,
    tournamentSize, setTournamentSize,
    isVsAI, setIsVsAI,
    setPlayerTeam, setOpponentTeam,
    setPlayerTeamMoves, setOpponentTeamMoves
  } = useBattle();

  const [entries, setEntries] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [localizedNames, setLocalizedNames] = useState<Record<string, string>>({});
  const [pokemonSearchTerm, setPokemonSearchTerm] = useState('');

  // Player 1 States
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerPokemon, setPlayerPokemon] = useState<any>(null);
  const [playerSpecies, setPlayerSpecies] = useState<any>(null);
  const [playerMoves, setPlayerMoves] = useState<any[]>([]);
  const [showP1Info, setShowP1Info] = useState(false);
  const [playerPokedexTab, setPlayerPokedexTab] = useState<'info' | 'moves'>('info');

  const [selectedPlayer2, setSelectedPlayer2] = useState<any>(null);
  const [playerPokemon2, setPlayerPokemon2] = useState<any>(null);
  const [playerSpecies2, setPlayerSpecies2] = useState<any>(null);
  const [playerMoves2, setPlayerMoves2] = useState<any[]>([]);
  const [showP1Info2, setShowP1Info2] = useState(false);
  const [playerPokedexTab2, setPlayerPokedexTab2] = useState<'info' | 'moves'>('info');

  // Player 2 States
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<any>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<any>(null);
  const [opponentMoves, setOpponentMoves] = useState<any[]>([]);
  const [showP2Info, setShowP2Info] = useState(false);
  const [opponentPokedexTab, setOpponentPokedexTab] = useState<'info' | 'moves'>('info');

  const [selectedOpponent2, setSelectedOpponent2] = useState<any>(null);
  const [opponentPokemon2, setOpponentPokemon2] = useState<any>(null);
  const [opponentSpecies2, setOpponentSpecies2] = useState<any>(null);
  const [opponentMoves2, setOpponentMoves2] = useState<any[]>([]);
  const [showP2Info2, setShowP2Info2] = useState(false);
  const [opponentPokedexTab2, setOpponentPokedexTab2] = useState<'info' | 'moves'>('info');

  // Move Modal States
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<'player1' | 'player1_2' | 'player2' | 'player2_2' | null>(null);
  const [availableMovesDetails, setAvailableMovesDetails] = useState<any[]>([]);
  const [isLoadingAvailableMoves, setIsLoadingAvailableMoves] = useState(false);
  const [tempSelectedMoves, setTempSelectedMoves] = useState<any[]>([]);
  const [moveSearchTerm, setMoveSearchTerm] = useState('');
  const [hoveredMove, setHoveredMove] = useState<any>(null);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokedex/${regionName === 'kanto' ? '2' : regionName === 'johto' ? '3' : regionName === 'hoenn' ? '4' : regionName === 'sinnoh' ? '5' : regionName === 'unova' ? '8' : regionName === 'kalos' ? '12' : regionName === 'alola' ? '16' : '27'}`);
        const data = await response.json();
        setEntries(data.pokemon_entries);

        const nameMap: Record<string, string> = {};
        const total = data.pokemon_entries.length;
        let completed = 0;

        const chunkSize = 20;
        for (let i = 0; i < total; i += chunkSize) {
          const chunk = data.pokemon_entries.slice(i, i + chunkSize);
          await Promise.all(chunk.map(async (entry: any) => {
            try {
              const res = await fetch(entry.pokemon_species.url);
              const speciesData = await res.json();
              const nameObj = speciesData.names.find((n: any) => n.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
              nameMap[entry.pokemon_species.name] = nameObj ? nameObj.name : entry.pokemon_species.name;
            } catch (e) {
              console.error(e);
            } finally {
              completed++;
              setLoadingProgress(Math.floor((completed / total) * 100));
            }
          }));
          // 브라우저 렌더링(Progress Bar UI 갱신)을 위해 메인 스레드에 휴식 부여
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        setLocalizedNames(prev => ({ ...prev, ...nameMap }));
      } catch (error) {
        console.error('Error fetching Pokedex:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [regionName, i18n.language]);

  const getLocalizedName = (species: any, defaultName: string) => {
    if (!species) return defaultName;
    const nameObj = species.names.find((n: any) => n.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return nameObj ? nameObj.name : defaultName;
  };

  const getLocalizedPokemonDescription = (species: any) => {
    if (!species) return '';
    const entries = species.flavor_text_entries.filter((e: any) => e.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return entries.length > 0 ? entries[0].flavor_text.replace(/\f/g, ' ') : '';
  };

  const getLocalizedMoveName = (move: any) => {
    if (!move) return '';
    const nameObj = move.names.find((n: any) => n.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return nameObj ? nameObj.name : move.name;
  };

  const getLocalizedMoveDescription = (move: any) => {
    if (!move) return '';
    const entries = move.flavor_text_entries.filter((e: any) => e.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return entries.length > 0 ? entries[0].flavor_text.replace(/\f/g, ' ') : '';
  };

  const togglePanel = (panel: 'p1' | 'p1_2' | 'p2' | 'p2_2') => {
    if (panel === 'p1') {
      setShowP1Info(prev => !prev);
      setShowP1Info2(false);
    } else if (panel === 'p1_2') {
      setShowP1Info(false);
      setShowP1Info2(prev => !prev);
    } else if (panel === 'p2') {
      setShowP2Info(prev => !prev);
      setShowP2Info2(false);
    } else if (panel === 'p2_2') {
      setShowP2Info(false);
      setShowP2Info2(prev => !prev);
    }
  };

  const openPanel = (panel: 'p1' | 'p1_2' | 'p2' | 'p2_2') => {
    if (panel === 'p1') {
      setShowP1Info(true);
      setShowP1Info2(false);
    } else if (panel === 'p1_2') {
      setShowP1Info(false);
      setShowP1Info2(true);
    } else if (panel === 'p2') {
      setShowP2Info(true);
      setShowP2Info2(false);
    } else if (panel === 'p2_2') {
      setShowP2Info(false);
      setShowP2Info2(true);
    }
  };

  const handleSelect = async (entry: any) => {
    const id = entry.pokemon_species.url.split('/').filter(Boolean).pop();
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonData = await pokemonResponse.json();
    const speciesResponse = await fetch(entry.pokemon_species.url);
    const speciesData = await speciesResponse.json();

    const fetchMoves = async (pokemon: any) => {
      if (pokemon.name === 'magikarp') {
        const r = await fetch('https://pokeapi.co/api/v2/move/splash');
        return [await r.json()];
      } else {
        const movesPromises = pokemon.moves.slice(0, 4).map(async (m: any) => {
          const r = await fetch(m.move.url);
          return r.json();
        });
        return await Promise.all(movesPromises);
      }
    };

    const movesData = await fetchMoves(pokemonData);

    if (!selectedPlayer) {
      setSelectedPlayer(pokemonData);
      setPlayerPokemon(pokemonData);
      setPlayerSpecies(speciesData);
      setPlayerMoves(movesData);
      openPanel('p1');
    } else if (battleMode === '2v2' && !selectedPlayer2) {
      setSelectedPlayer2(pokemonData);
      setPlayerPokemon2(pokemonData);
      setPlayerSpecies2(speciesData);
      setPlayerMoves2(movesData);
      openPanel('p1_2');
    } else if (!selectedOpponent && !isTournament) {
      setSelectedOpponent(pokemonData);
      setOpponentPokemon(pokemonData);
      setOpponentSpecies(speciesData);
      setOpponentMoves(movesData);
      openPanel('p2');
    } else if (battleMode === '2v2' && !selectedOpponent2 && !isTournament) {
      setSelectedOpponent2(pokemonData);
      setOpponentPokemon2(pokemonData);
      setOpponentSpecies2(speciesData);
      setOpponentMoves2(movesData);
      openPanel('p2_2');
    }
  };

  const openMoveEditModal = async (player: 'player1' | 'player1_2' | 'player2' | 'player2_2') => {
    setEditingPlayer(player);
    const pokemon = player === 'player1' ? playerPokemon : player === 'player1_2' ? playerPokemon2 : player === 'player2' ? opponentPokemon : opponentPokemon2;
    const currentMoves = player === 'player1' ? playerMoves : player === 'player1_2' ? playerMoves2 : player === 'player2' ? opponentMoves : opponentMoves2;
    setTempSelectedMoves([...currentMoves]);
    setIsMoveModalOpen(true);
    setIsLoadingAvailableMoves(true);

    try {
      const details = await Promise.all(pokemon.moves.map(async (m: any) => {
        const res = await fetch(m.move.url);
        return res.json();
      }));
      setAvailableMovesDetails(details);
    } catch (error) {
      console.error('Error loading moves:', error);
    } finally {
      setIsLoadingAvailableMoves(false);
    }
  };

  const toggleTempMove = (move: any) => {
    const isAlreadySelected = tempSelectedMoves.find(m => m.name === move.name);
    if (isAlreadySelected) {
      setTempSelectedMoves(tempSelectedMoves.filter(m => m.name !== move.name));
    } else if (tempSelectedMoves.length < 4) {
      setTempSelectedMoves([...tempSelectedMoves, move]);
    }
  };

  const confirmMoveSelection = () => {
    if (editingPlayer === 'player1') {
      setPlayerMoves(tempSelectedMoves);
    } else if (editingPlayer === 'player1_2') {
      setPlayerMoves2(tempSelectedMoves);
    } else if (editingPlayer === 'player2') {
      setOpponentMoves(tempSelectedMoves);
    } else if (editingPlayer === 'player2_2') {
      setOpponentMoves2(tempSelectedMoves);
    }
    setIsMoveModalOpen(false);
  };

  const bgPath = REGION_BG_MAP[regionName] || REGION_BG_MAP.kanto;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden relative font-sans selection:bg-blue-500/30">
      
      {/* 고정 배경 레이어 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img src={bgPath} className="w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0a0a0a] z-20"></div>
        <div className="absolute inset-0 opacity-[0.15] z-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <header className="shrink-0 h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-3xl relative z-[60]">
        <div className="flex items-center gap-6">
          <div onClick={() => router.back()} className="cursor-pointer group flex items-center gap-4">
            <div className="w-9 h-9 bg-red-600/80 border border-white/20 rounded-xl shadow-xl group-hover:scale-110 transition-all flex items-center justify-center text-white relative overflow-hidden">
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em] leading-none mb-0.5 opacity-70">Encyclopedia</span>
              <h1 className="text-lg sm:text-xl font-mono text-white uppercase font-black tracking-tighter leading-none">{regionName} Sector</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="relative group/search hidden md:block max-w-[200px] lg:max-w-[280px] w-full mr-2">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within/search:text-blue-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              value={pokemonSearchTerm}
              onChange={(e) => setPokemonSearchTerm(e.target.value)}
              placeholder={t('Search...')}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-1.5 font-sans text-xs text-white placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all backdrop-blur-md"
            />
          </div>
          <button onClick={() => { setSelectedPlayer(null); setSelectedPlayer2(null); setSelectedOpponent(null); setSelectedOpponent2(null); setPlayerPokemon(null); setPlayerPokemon2(null); setOpponentPokemon(null); setOpponentPokemon2(null); setPokemonSearchTerm(''); }} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white font-mono font-black text-[9px] uppercase transition-all rounded-lg backdrop-blur-md">Reset</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        {/* P1 상세 */}
        {selectedPlayer && showP1Info && (
          <div className={`lg:shrink-0 h-full ${(typeof window !== 'undefined' && window.innerWidth < 1024) ? 'fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center' : 'relative z-40 flex flex-col justify-center'}`}>
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP1Info(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-left">
              <PokedexSidePanel
                pokemon={selectedPlayer}
                species={playerSpecies}
                moves={playerMoves}
                tab={playerPokedexTab}
                onTabChange={setPlayerPokedexTab}
                onEdit={() => openMoveEditModal('player1')}
                onClose={() => { setShowP1Info(false); setSelectedPlayer(null); setPlayerPokemon(null); }}
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}

        {/* P1-2 상세 */}
        {selectedPlayer2 && showP1Info2 && (
          <div className={`lg:shrink-0 h-full ${(typeof window !== 'undefined' && window.innerWidth < 1024) ? 'fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center' : 'relative z-40 flex flex-col justify-center'}`}>
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP1Info2(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-left">
              <PokedexSidePanel
                pokemon={selectedPlayer2}
                species={playerSpecies2}
                moves={playerMoves2}
                tab={playerPokedexTab2}
                onTabChange={setPlayerPokedexTab2}
                onEdit={() => openMoveEditModal('player1_2')}
                onClose={() => { setShowP1Info2(false); setSelectedPlayer2(null); setPlayerPokemon2(null); }}
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}

        {/* 중앙 그리드 */}
        <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-8 relative z-50">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 animate-spin" style={{ animationDuration: '1.5s' }}>
                <div className="w-full h-full rounded-full border-[6px] border-black bg-gradient-to-b from-red-500 from-50% to-white to-50% flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.5)]">
                  <div className="w-full h-3 sm:h-4 bg-black absolute top-1/2 -translate-y-1/2"></div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white border-[5px] sm:border-[6px] border-black rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-red-500 border-2 border-black rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center w-64 sm:w-80 gap-3">
                <div className="flex justify-between w-full px-2">
                  <p className="text-xs sm:text-sm font-mono text-white uppercase font-black tracking-[0.2em] animate-pulse">Syncing Data...</p>
                  <p className="text-xs sm:text-sm font-mono text-blue-400 font-black">{loadingProgress}%</p>
                </div>
                <div className="w-full bg-black/60 border border-white/20 rounded-full h-4 sm:h-5 overflow-hidden shadow-inner p-0.5 sm:p-1">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ease-out rounded-full relative overflow-hidden" style={{ width: `${loadingProgress}%` }}>
                     <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-stripe-scroll"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 transition-all duration-700 ${(selectedPlayer && selectedOpponent) ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5' : (selectedPlayer || selectedOpponent) ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-7' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'}`}>
              {entries.filter(entry => {
                const name = localizedNames[entry.pokemon_species.name] || entry.pokemon_species.name;
                return matchChosung(name, pokemonSearchTerm);
              }).map((entry, idx) => {
                const id = entry.pokemon_species.url.split('/').filter(Boolean).pop();
                const isP1 = selectedPlayer?.name === entry.pokemon_species.name;
                const isP2 = selectedOpponent?.name === entry.pokemon_species.name;
                const displayName = localizedNames[entry.pokemon_species.name] || entry.pokemon_species.name;

                return (
                  <div
                    key={entry.pokemon_species.name}
                    onClick={() => handleSelect(entry)}
                    style={{ animationDelay: `${(idx % 20) * 40}ms` }}
                    className={`group relative p-0.5 rounded-[1.2rem] cursor-pointer transition-all duration-500 animate-in fade-in zoom-in-90 fill-mode-both 
                      ${isP1 && isP2 ? 'bg-gradient-to-br from-blue-500 to-red-600 scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : isP1 ? 'bg-blue-500 scale-95 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : isP2 ? 'bg-red-600 scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white/5 hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] active:scale-95'}`}
                  >
                    <div className="bg-[#1a1a1a]/40 backdrop-blur-md border border-white/5 rounded-[1rem] p-2 sm:p-3 flex flex-col items-center relative overflow-hidden h-full min-h-[100px] sm:min-h-[140px] justify-center">
                      <div className="absolute top-1.5 right-2 text-[8px] font-mono text-white/10 font-black">#{String(id).padStart(3, '0')}</div>
                      {(isP1 || isP2) && (
                        <div className="absolute top-1.5 left-2 flex gap-1">
                          {isP1 && <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]"></div>}
                          {isP2 && <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_#dc2626]"></div>}
                        </div>
                      )}
                      <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} className={`w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-500 relative z-10 ${isP1 || isP2 ? 'scale-110' : 'group-hover:scale-125'}`} style={{ imageRendering: 'pixelated' }} />
                      <h3 className={`mt-1 sm:mt-2 font-sans font-black text-[10px] sm:text-xs uppercase truncate w-full text-center tracking-tight transition-colors ${isP1 || isP2 ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{displayName}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* P2 상세 */}
        {selectedOpponent && showP2Info && (
          <div className={`lg:shrink-0 h-full ${(typeof window !== 'undefined' && window.innerWidth < 1024) ? 'fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center' : 'relative z-40 flex flex-col justify-center'}`}>
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP2Info(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-right">
              <PokedexSidePanel
                pokemon={selectedOpponent}
                species={opponentSpecies}
                moves={opponentMoves}
                tab={opponentPokedexTab}
                onTabChange={setOpponentPokedexTab}
                onEdit={() => openMoveEditModal('player2')}
                onClose={() => { setShowP2Info(false); setSelectedOpponent(null); setOpponentPokemon(null); }}
                isOpponent
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}

        {/* P2-2 상세 */}
        {selectedOpponent2 && showP2Info2 && (
          <div className={`lg:shrink-0 h-full ${(typeof window !== 'undefined' && window.innerWidth < 1024) ? 'fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center' : 'relative z-40 flex flex-col justify-center'}`}>
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP2Info2(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-right">
              <PokedexSidePanel
                pokemon={selectedOpponent2}
                species={opponentSpecies2}
                moves={opponentMoves2}
                tab={opponentPokedexTab2}
                onTabChange={setOpponentPokedexTab2}
                onEdit={() => openMoveEditModal('player2_2')}
                onClose={() => { setShowP2Info2(false); setSelectedOpponent2(null); setOpponentPokemon2(null); }}
                isOpponent
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="shrink-0 p-4 flex flex-col sm:flex-row justify-center items-center gap-4 z-[50] relative">
        <div className="flex flex-col gap-2 items-center mr-4">
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/20 gap-2">
            <div className="flex">
              <button onClick={() => setBattleMode('1v1')} className={`px-2 sm:px-3 py-1 rounded-l-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all border-r border-white/10 ${battleMode === '1v1' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white'}`}>1v1</button>
              <button onClick={() => setBattleMode('2v2')} className={`px-2 sm:px-3 py-1 rounded-r-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all ${battleMode === '2v2' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white'}`}>2v2</button>
            </div>
            <div className="w-[1px] bg-white/20"></div>
            <div className="flex">
              <button onClick={() => setIsVsAI(false)} className={`px-2 sm:px-3 py-1 rounded-l-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all border-r border-white/10 ${!isVsAI ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white'}`}>PvP</button>
              <button onClick={() => setIsVsAI(true)} className={`px-2 sm:px-3 py-1 rounded-r-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all ${isVsAI ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white'}`}>PvE (AI)</button>
            </div>
          </div>
          
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/20 gap-2 items-center">
            <button onClick={() => setIsTournament(!isTournament)} className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all border ${isTournament ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'border-transparent text-white/40 hover:text-white'}`}>
              Tourney: {isTournament ? 'ON' : 'OFF'}
            </button>
            {isTournament && (
              <select 
                value={tournamentSize} 
                onChange={(e) => setTournamentSize(Number(e.target.value) as 4|8|16|32)}
                className="bg-black/50 text-yellow-400 font-mono text-xs font-black border border-yellow-500/50 rounded p-1 outline-none appearance-none cursor-pointer hover:bg-yellow-500/10 transition-colors"
              >
                <option value={4}>4 Players</option>
                <option value={8}>8 Players</option>
                <option value={16}>16 Players</option>
                <option value={32}>32 Players</option>
              </select>
            )}
          </div>
        </div>

        <div className="w-full max-w-4xl flex items-center gap-6 relative z-10">
          <div className="flex-1 flex justify-around items-center bg-black/40 backdrop-blur-xl border-2 border-black p-2 rounded-[1.5rem] shadow-2xl relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#DC0A2D] border-2 border-black px-3 py-0.5 rounded-full z-10 shadow-lg"><span className="text-[7px] font-mono text-white font-black tracking-[0.3em] uppercase whitespace-nowrap">READY</span></div>
            
            <div className="flex items-center gap-3">
              <div onClick={() => selectedPlayer && togglePanel('p1')} className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center relative cursor-pointer ${selectedPlayer ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/5 border-dashed opacity-40'}`}>
                {selectedPlayer && <img src={selectedPlayer.sprites.front_default} className="w-14 h-14 max-w-none absolute drop-shadow-lg animate-float" style={{ imageRendering: 'pixelated' }} />}
              </div>
              {battleMode === '2v2' && (
                <div onClick={() => selectedPlayer2 && togglePanel('p1_2')} className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center relative cursor-pointer ${selectedPlayer2 ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/5 border-dashed opacity-40'}`}>
                  {selectedPlayer2 && <img src={selectedPlayer2.sprites.front_default} className="w-14 h-14 max-w-none absolute drop-shadow-lg animate-float" style={{ imageRendering: 'pixelated' }} />}
                </div>
              )}
            </div>

            <div className="text-xl font-mono text-white/10 font-black italic tracking-tighter">VS</div>

            <div className="flex items-center gap-3">
              {(!isTournament && !isVsAI) ? (
                <>
                  {battleMode === '2v2' && (
                    <div onClick={() => selectedOpponent2 && togglePanel('p2_2')} className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center relative cursor-pointer ${selectedOpponent2 ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/5 border-dashed opacity-40'}`}>
                      {selectedOpponent2 && <img src={selectedOpponent2.sprites.front_default} className="w-14 h-14 max-w-none absolute drop-shadow-lg animate-float" style={{ imageRendering: 'pixelated' }} />}
                    </div>
                  )}
                  <div onClick={() => selectedOpponent && togglePanel('p2')} className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center relative cursor-pointer ${selectedOpponent ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/5 border-dashed opacity-40'}`}>
                    {selectedOpponent && <img src={selectedOpponent.sprites.front_default} className="w-14 h-14 max-w-none absolute drop-shadow-lg animate-float" style={{ imageRendering: 'pixelated' }} />}
                  </div>
                </>
              ) : (
                <div className="w-12 h-12 rounded-xl border-2 bg-red-500/10 border-red-500/30 flex items-center justify-center relative">
                  <span className="text-xs font-mono font-black text-red-400 text-center leading-none">CPU<br/><span className="text-[8px]">AUTO</span></span>
                </div>
              )}
            </div>
          </div>
          
          <button onClick={async () => {
            const team1 = []; const moves1 = [];
            if (selectedPlayer) { team1.push(playerPokemon); moves1.push(playerMoves); }
            if (selectedPlayer2) { team1.push(playerPokemon2); moves1.push(playerMoves2); }
            
            const team2 = []; const moves2 = [];
            
            if (isTournament) {
              setPlayerTeam(team1);
              setPlayerTeamMoves(moves1);
              router.push('/tournament');
              return;
            }

            if (isVsAI) {
              // Auto generate AI opponents
              for (let i = 0; i < (battleMode === '2v2' ? 2 : 1); i++) {
                const randomId = Math.floor(Math.random() * 898) + 1;
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
                const data = await res.json();
                team2.push(data);
                moves2.push(await getRandomMoves(data.moves, 4));
              }
            } else {
              if (selectedOpponent) { team2.push(opponentPokemon); moves2.push(opponentMoves); }
              if (selectedOpponent2) { team2.push(opponentPokemon2); moves2.push(opponentMoves2); }
            }

            setPlayerTeam(team1);
            setPlayerTeamMoves(moves1);
            setOpponentTeam(team2);
            setOpponentTeamMoves(moves2);
            
            // Maintain 1v1 compatibility
            setContextPlayerPokemon(team1[0]);
            setContextPlayerMoves(moves1[0]);
            setContextOpponentPokemon(team2[0]);
            setContextOpponentMoves(moves2[0]);
            
            router.push('/battle');
            
          }} disabled={!selectedPlayer || (battleMode === '2v2' && !selectedPlayer2) || (!isTournament && !isVsAI && !selectedOpponent) || (!isTournament && !isVsAI && battleMode === '2v2' && !selectedOpponent2)} className="group relative px-6 sm:px-8 py-2 sm:py-3 bg-yellow-400 border-[4px] border-black rounded-[1.5rem] shadow-xl hover:-translate-y-1 active:translate-y-0.5 disabled:opacity-20 transition-all overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <span className="relative z-10 text-sm sm:text-lg font-mono font-black text-black uppercase italic tracking-tighter">
              {isTournament ? 'Enter Tourney' : t('Battle')}
            </span>
          </button>
        </div>
      </footer>

      {isMoveModalOpen && editingPlayer && (
        <MoveEditModal
          editingPlayer={editingPlayer}
          moveSearchTerm={moveSearchTerm}
          setMoveSearchTerm={setMoveSearchTerm}
          tempSelectedMoves={tempSelectedMoves}
          toggleTempMove={toggleTempMove}
          isLoadingAvailableMoves={isLoadingAvailableMoves}
          availableMovesDetails={availableMovesDetails}
          hoveredMove={hoveredMove}
          setHoveredMove={setHoveredMove}
          setIsMoveModalOpen={setIsMoveModalOpen}
          confirmMoveSelection={confirmMoveSelection}
          getLocalizedMoveName={getLocalizedMoveName}
          getLocalizedMoveDescription={getLocalizedMoveDescription}
          t={t}
        />
      )}

      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes ken-burns { 0% { transform: scale(1); } 100% { transform: scale(1.1) translate(1%, 1%); } }
        .animate-ken-burns { animation: ken-burns 20s linear infinite alternate; }
        @keyframes stripe-scroll { 0% { background-position: 0 0; } 100% { background-position: 20px 0; } }
        .animate-stripe-scroll { animation: stripe-scroll 1s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
