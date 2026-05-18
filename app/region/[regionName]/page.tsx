'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { typeThemes } from '@/src/constants/pokemon';
import PokedexSidePanel from '@/src/components/PokedexSidePanel';
import MoveEditModal from '@/src/components/MoveEditModal';
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
    setOpponentMoves: setContextOpponentMoves 
  } = useBattle();

  const [entries, setEntries] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [localizedNames, setLocalizedNames] = useState<Record<string, string>>({});
  const [pokemonSearchTerm, setPokemonSearchTerm] = useState('');

  // Player 1 States
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerPokemon, setPlayerPokemon] = useState<any>(null);
  const [playerSpecies, setPlayerSpecies] = useState<any>(null);
  const [playerMoves, setPlayerMoves] = useState<any[]>([]);
  const [showP1Info, setShowP1Info] = useState(false);
  const [playerPokedexTab, setPlayerPokedexTab] = useState<'info' | 'moves'>('info');

  // Player 2 States
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<any>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<any>(null);
  const [opponentMoves, setOpponentMoves] = useState<any[]>([]);
  const [showP2Info, setShowP2Info] = useState(false);
  const [opponentPokedexTab, setOpponentPokedexTab] = useState<'info' | 'moves'>('info');

  // Move Modal States
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<'player1' | 'player2' | null>(null);
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
        await Promise.all(data.pokemon_entries.slice(0, 50).map(async (entry: any) => {
          const res = await fetch(entry.pokemon_species.url);
          const speciesData = await res.json();
          const nameObj = speciesData.names.find((n: any) => n.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
          nameMap[entry.pokemon_species.name] = nameObj ? nameObj.name : entry.pokemon_species.name;
        }));
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

  const handleSelect = async (entry: any) => {
    const id = entry.pokemon_species.url.split('/').filter(Boolean).pop();
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonData = await pokemonResponse.json();

    if (!selectedPlayer) {
      setSelectedPlayer(pokemonData);
      setPlayerPokemon(pokemonData);
      const speciesResponse = await fetch(entry.pokemon_species.url);
      const speciesData = await speciesResponse.json();
      setPlayerSpecies(speciesData);
      
      const movesPromises = pokemonData.moves.slice(0, 4).map(async (m: any) => {
        const r = await fetch(m.move.url);
        return r.json();
      });
      const movesData = await Promise.all(movesPromises);
      setPlayerMoves(movesData);
      setShowP1Info(true);
    } else if (!selectedOpponent) {
      setSelectedOpponent(pokemonData);
      setOpponentPokemon(pokemonData);
      const speciesResponse = await fetch(entry.pokemon_species.url);
      const speciesData = await speciesResponse.json();
      setOpponentSpecies(speciesData);
      
      const movesPromises = pokemonData.moves.slice(0, 4).map(async (m: any) => {
        const r = await fetch(m.move.url);
        return r.json();
      });
      const movesData = await Promise.all(movesPromises);
      setOpponentMoves(movesData);
      setShowP2Info(true);
    }
  };

  const openMoveEditModal = async (player: 'player1' | 'player2') => {
    setEditingPlayer(player);
    const pokemon = player === 'player1' ? playerPokemon : opponentPokemon;
    const currentMoves = player === 'player1' ? playerMoves : opponentMoves;
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
    } else {
      setOpponentMoves(tempSelectedMoves);
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
          <button onClick={() => { setSelectedPlayer(null); setSelectedOpponent(null); setPlayerPokemon(null); setOpponentPokemon(null); setPokemonSearchTerm(''); }} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white font-mono font-black text-[9px] uppercase transition-all rounded-lg backdrop-blur-md">Reset</button>
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

        {/* 중앙 그리드 */}
        <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-mono text-white/40 uppercase font-black tracking-[0.5em] animate-pulse">Syncing...</p>
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 transition-all duration-700 ${(selectedPlayer && selectedOpponent) ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5' : (selectedPlayer || selectedOpponent) ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-7' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'}`}>
              {entries.filter(entry => {
                const name = localizedNames[entry.pokemon_species.name] || entry.pokemon_species.name;
                return name.toLowerCase().includes(pokemonSearchTerm.toLowerCase());
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
      </main>

      <footer className="shrink-0 p-4 flex justify-center items-center z-[50] relative">
        <div className="w-full max-w-4xl flex items-center gap-6 relative z-10">
          <div className="flex-1 flex justify-around items-center bg-black/40 backdrop-blur-xl border-2 border-black p-2 rounded-[1.5rem] shadow-2xl relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#DC0A2D] border-2 border-black px-3 py-0.5 rounded-full z-10 shadow-lg"><span className="text-[7px] font-mono text-white font-black tracking-[0.3em] uppercase whitespace-nowrap">READY</span></div>
            <div className="flex items-center gap-3">
              <div onClick={() => selectedPlayer && setShowP1Info(true)} className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center relative cursor-pointer ${selectedPlayer ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/5 border-dashed opacity-40'}`}>
                {selectedPlayer && <img src={selectedPlayer.sprites.front_default} className="w-14 h-14 max-w-none absolute drop-shadow-lg animate-float" style={{ imageRendering: 'pixelated' }} />}
              </div>
              <span className="hidden sm:block text-[9px] font-mono text-white/50 font-black uppercase tracking-widest truncate max-w-[80px]">{selectedPlayer ? getLocalizedName(playerSpecies, selectedPlayer.name) : 'P1'}</span>
            </div>
            <div className="text-xl font-mono text-white/10 font-black italic tracking-tighter">VS</div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-[9px] font-mono text-white/50 font-black uppercase tracking-widest truncate max-w-[80px] text-right">{selectedOpponent ? getLocalizedName(opponentSpecies, selectedOpponent.name) : 'P2'}</span>
              <div onClick={() => selectedOpponent && setShowP2Info(true)} className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center relative cursor-pointer ${selectedOpponent ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/5 border-dashed opacity-40'}`}>
                {selectedOpponent && <img src={selectedOpponent.sprites.front_default} className="w-14 h-14 max-w-none absolute drop-shadow-lg animate-float" style={{ imageRendering: 'pixelated' }} />}
              </div>
            </div>
          </div>
          <button onClick={() => {
            setContextPlayerPokemon(playerPokemon);
            setContextOpponentPokemon(opponentPokemon);
            setContextPlayerMoves(playerMoves);
            setContextOpponentMoves(opponentMoves);
            router.push('/battle');
          }} disabled={!selectedPlayer || !selectedOpponent} className="group relative px-8 py-3 bg-yellow-400 border-[4px] border-black rounded-[1.5rem] shadow-xl hover:-translate-y-1 active:translate-y-0.5 disabled:opacity-20 transition-all overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <span className="relative z-10 text-lg font-mono font-black text-black uppercase italic tracking-tighter">{t('Battle')}</span>
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
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
