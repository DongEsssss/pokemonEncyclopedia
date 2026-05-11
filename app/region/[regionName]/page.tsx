"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPokedexByRegion, getPokemon, Pokemon, PokedexEntry, getRandomMoves, MoveDetails, getMovesDetails, PokemonMove, PokemonSpecies, getPokemonSpecies } from '@/src/services/pokeapi';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';

/**
 * 타입별 네온 테마 컬러
 */
const typeThemes: Record<string, { color: string, shadow: string }> = {
  normal: { color: '#A8A878', shadow: 'rgba(168, 168, 120, 0.5)' },
  fire: { color: '#F08030', shadow: 'rgba(240, 128, 48, 0.5)' },
  water: { color: '#6890F0', shadow: 'rgba(104, 144, 240, 0.5)' },
  grass: { color: '#78C850', shadow: 'rgba(120, 200, 80, 0.5)' },
  electric: { color: '#F8D030', shadow: 'rgba(248, 208, 48, 0.5)' },
  ice: { color: '#98D8D8', shadow: 'rgba(152, 216, 216, 0.5)' },
  fighting: { color: '#C03028', shadow: 'rgba(192, 48, 40, 0.5)' },
  poison: { color: '#A040A0', shadow: 'rgba(160, 64, 160, 0.5)' },
  ground: { color: '#E0C068', shadow: 'rgba(224, 192, 104, 0.5)' },
  flying: { color: '#A890F0', shadow: 'rgba(168, 144, 240, 0.5)' },
  psychic: { color: '#F85888', shadow: 'rgba(248, 88, 136, 0.5)' },
  bug: { color: '#A8B820', shadow: 'rgba(168, 184, 32, 0.5)' },
  rock: { color: '#B8A038', shadow: 'rgba(184, 160, 56, 0.5)' },
  ghost: { color: '#705898', shadow: 'rgba(112, 88, 152, 0.5)' },
  dragon: { color: '#7038F8', shadow: 'rgba(112, 56, 248, 0.5)' },
  dark: { color: '#705848', shadow: 'rgba(112, 88, 72, 0.5)' },
  steel: { color: '#B8B8D0', shadow: 'rgba(184, 184, 208, 0.5)' },
  fairy: { color: '#EE99AC', shadow: 'rgba(238, 153, 172, 0.5)' }
};

export default function RegionPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const regionName = params.regionName as string;

  const [entries, setEntries] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [localizedNames, setLocalizedNames] = useState<Record<string, string>>({});

  const { setPlayerPokemon, setOpponentPokemon, playerMoves, opponentMoves, setPlayerMoves, setOpponentMoves } = useBattle();
  const [selectedPlayer, setSelectedPlayer] = useState<Pokemon | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<Pokemon | null>(null);
  const [playerSpecies, setPlayerSpecies] = useState<PokemonSpecies | null>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<PokemonSpecies | null>(null);
  
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [tempSelectedMoves, setTempSelectedMoves] = useState<MoveDetails[]>([]);
  const [availableMovesDetails, setAvailableMovesDetails] = useState<MoveDetails[]>([]);
  const [isLoadingAvailableMoves, setIsLoadingAvailableMoves] = useState(false);
  
  const [playerPokedexTab, setPlayerPokedexTab] = useState<'info' | 'moves'>('info');
  const [opponentPokedexTab, setOpponentPokedexTab] = useState<'info' | 'moves'>('info');

  const mainScrollRef = useRef<HTMLDivElement>(null);

  // --- 현지화 유틸리티 ---
  const getLocalizedName = (species: PokemonSpecies | null, defaultName: string) => {
    if (!species) return defaultName;
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const nameObj = species.names.find(n => n.language.name === lang) || 
                   species.names.find(n => n.language.name === 'ko') || 
                   species.names.find(n => n.language.name === 'en');
    return nameObj ? nameObj.name : defaultName;
  };

  const getLocalizedMoveName = (move: MoveDetails) => {
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const nameObj = move.names.find(n => n.language.name === lang) || 
                   move.names.find(n => n.language.name === 'ko') || 
                   move.names.find(n => n.language.name === 'en');
    return nameObj ? nameObj.name : move.name;
  };

  const getLocalizedPokemonDescription = (species: PokemonSpecies | null) => {
    if (!species) return '';
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const descObj = species.flavor_text_entries.find(f => f.language.name === lang) || 
                    species.flavor_text_entries.find(f => f.language.name === 'ko') || 
                    species.flavor_text_entries.find(f => f.language.name === 'en');
    return descObj ? descObj.flavor_text.replace(/[\n\f\r]/g, ' ') : '';
  };

  /**
   * 프리미엄 포켓몬 도감 디바이스 (반응형 버전)
   */
  const PokedexSidePanel = ({ pokemon, species, moves, tab, onTabChange, onEdit, onClose, isOpponent }: any) => (
    <div className={`w-full md:w-[320px] lg:w-[360px] h-[70vh] md:h-[calc(100vh-140px)] flex flex-col bg-[#1a1a1a]/95 border-t-[6px] md:border-t-0 md:border-x-[6px] border-black shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom md:slide-in-from-left z-40`}>
      
      {/* 장치 헤더 */}
      <div className="bg-[#DC0A2D] p-3 sm:p-4 flex items-center justify-between border-b-[4px] sm:border-b-[6px] border-black shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#28aafd] border-4 border-white shadow-[0_0_15px_#28aafd,inset_4px_4px_8px_rgba(0,0,0,0.5)]"></div>
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-white/60 leading-none">SYSTEM.IDENTIFY</span>
            <span className="text-white font-mono font-black text-xs sm:text-sm uppercase tracking-widest">{isOpponent ? 'Player 2' : 'Player 1'}</span>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-bold transition-all text-xs sm:text-base">✕</button>
      </div>

      <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
        <div className="flex bg-black/40 p-1 rounded-xl gap-1 mb-4 sm:mb-5 border-2 border-white/5 shadow-inner">
          <button onClick={() => onTabChange('info')} className={`flex-1 py-1.5 sm:py-2 font-mono text-[9px] sm:text-[11px] uppercase font-black rounded-lg transition-all ${tab === 'info' ? 'bg-[#28aafd] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{t('Information')}</button>
          <button onClick={() => onTabChange('moves')} className={`flex-1 py-1.5 sm:py-2 font-mono text-[9px] sm:text-[11px] uppercase font-black rounded-lg transition-all ${tab === 'moves' ? 'bg-[#28aafd] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{t('Skill Set')}</button>
        </div>

        {tab === 'info' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-black/60 border-2 border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden min-h-[240px] sm:min-h-[300px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan"></div>
                <div className="absolute top-2 left-3 text-[7px] sm:text-[9px] font-mono text-blue-400/60 font-black tracking-widest">ID: {String(pokemon.id).padStart(4, '0')}</div>
                <img src={pokemon.sprites.front_default} className="w-40 h-40 sm:w-60 sm:h-60 drop-shadow-[0_0_30px_rgba(40,170,253,0.4)] animate-pulse-slow" style={{ imageRendering: 'pixelated' }} />
                <h2 className="text-2xl sm:text-4xl font-mono text-white uppercase font-black tracking-tighter text-center mt-1 sm:mt-2 drop-shadow-lg">{getLocalizedName(species, pokemon.name)}</h2>
                <div className="flex gap-2 mt-3 sm:mt-4">
                  {pokemon.types.map(t => (
                    <span key={t.type.name} className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[9px] font-black text-white uppercase border border-white/20 shadow-lg" style={{ backgroundColor: typeThemes[t.type.name]?.color, boxShadow: `0 4px 12px ${typeThemes[t.type.name]?.shadow}` }}>{t.type.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400"></div>
                <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">Description</span>
              </div>
              <p className="font-mono text-[10px] sm:text-[12px] text-white/80 leading-relaxed">{getLocalizedPokemonDescription(species)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-white/5 border border-white/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                <span className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase">Dimensions</span>
                <div className="mt-1 flex justify-between text-[10px] sm:text-xs font-mono text-white"><span>HT:</span><span className="font-black text-blue-400">{pokemon.height / 10}m</span></div>
                <div className="flex justify-between text-[10px] sm:text-xs font-mono text-white"><span>WT:</span><span className="font-black text-blue-400">{pokemon.weight / 10}kg</span></div>
              </div>
              <div className="bg-white/5 border border-white/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between">
                <span className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase">Base Stats</span>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {pokemon.stats.slice(0, 6).map((s: any) => (
                    <div key={s.stat.name} className="flex flex-col items-center">
                      <span className="text-[6px] sm:text-[7px] text-white/40 font-black uppercase">{t(s.stat.name).substring(0,3)}</span>
                      <span className="text-[8px] sm:text-[10px] text-white font-black">{s.base_stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
             <div className="flex justify-between items-center px-2">
                <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Moveset</span>
                <button onClick={onEdit} className="px-2 sm:px-3 py-1 bg-yellow-400 text-black rounded-lg font-mono text-[8px] sm:text-[10px] font-black uppercase hover:bg-yellow-300 transition-all">{t('Change')}</button>
             </div>
             <div className="space-y-2 sm:space-y-3">
                {moves.map((m: any) => (
                  <div key={m.id} className="relative bg-black/40 border border-white/10 p-2 sm:p-3 rounded-xl flex flex-col gap-0.5 sm:gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-sm font-black text-white uppercase">{getLocalizedMoveName(m)}</span>
                      <span className="text-[6px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 rounded-md text-white font-black" style={{ backgroundColor: typeThemes[m.type.name]?.color }}>{m.type.name}</span>
                    </div>
                    <div className="flex gap-3 sm:gap-4 text-[8px] sm:text-[9px] font-mono text-white/60">
                      <span>PWR: <span className="text-white">{m.power || '--'}</span></span>
                      <span>ACC: <span className="text-white">{m.accuracy || '--'}</span></span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );

  // --- 데이터 로직 ---
  useEffect(() => {
    async function loadRegion() {
      try {
        const data = await getPokedexByRegion(regionName);
        setEntries(data);
        const names: Record<string, string> = {};
        await Promise.all(data.map(async (entry) => {
          try {
            const species = await getPokemonSpecies(entry.pokemon_species.name);
            names[entry.pokemon_species.name] = getLocalizedName(species, entry.pokemon_species.name);
          } catch (e) { names[entry.pokemon_species.name] = entry.pokemon_species.name; }
        }));
        setLocalizedNames(names);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadRegion();
  }, [regionName]);

  const handleSelect = async (entry: PokedexEntry) => {
    const pkmn = await getPokemon(entry.pokemon_species.name);
    const species = await getPokemonSpecies(entry.pokemon_species.name);

    if (selectedPlayer?.name === pkmn.name) {
      setSelectedPlayer(null); setPlayerPokemon(null); setPlayerMoves([]); return;
    }
    if (selectedOpponent?.name === pkmn.name) {
      setSelectedOpponent(null); setOpponentPokemon(null); setOpponentMoves([]); return;
    }

    if (!selectedPlayer) {
      setSelectedPlayer(pkmn); setPlayerPokemon(pkmn); setPlayerSpecies(species);
      getRandomMoves(pkmn.moves, 4).then(setPlayerMoves);
    } else if (!selectedOpponent) {
      setSelectedOpponent(pkmn); setOpponentPokemon(pkmn); setOpponentSpecies(species);
      getRandomMoves(pkmn.moves, 4).then(setOpponentMoves);
    }
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
      } catch (e) { console.error(e); }
      finally { setIsLoadingAvailableMoves(false); }
    }
  };

  const toggleTempMove = (move: MoveDetails) => {
    setTempSelectedMoves(prev => {
      const exists = prev.find(m => m.name === move.name);
      if (exists) return prev.filter(m => m.name !== move.name);
      if (prev.length >= 4) return prev;
      return [...prev, move];
    });
  };

  const confirmMoveSelection = () => {
    if (tempSelectedMoves.length !== 4) return;
    if (editingPlayer === 'player1') {
      setPlayerMoves(tempSelectedMoves);
    } else {
      setOpponentMoves(tempSelectedMoves);
    }
    setIsMoveModalOpen(false);
    setEditingPlayer(null);
  };

  return (
    <div className="h-screen bg-[#050505] flex flex-col font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(40,170,253,0.05)_0%,transparent_70%)]"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <header className="z-50 bg-[#1a1a1a]/80 backdrop-blur-xl border-b-[4px] sm:border-b-[6px] border-black px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center shadow-2xl shrink-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <div onClick={() => router.push('/')} className="cursor-pointer group flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 border-2 sm:border-4 border-black rounded-lg sm:rounded-xl shadow-[3px_3px_0_0_#000] group-hover:translate-x-1 transition-all flex items-center justify-center text-white">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] sm:text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] leading-none mb-0.5 sm:mb-1">Pokedex Terminal</span>
              <h1 className="text-sm sm:text-xl font-mono text-white uppercase font-black tracking-tighter leading-none truncate max-w-[120px] sm:max-w-none">{regionName} Sector</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border-2 border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-mono text-white/60 font-black uppercase tracking-widest">Network Secure</span>
          </div>
          <button onClick={() => { setSelectedPlayer(null); setSelectedOpponent(null); setPlayerPokemon(null); setOpponentPokemon(null); }} className="px-2 sm:px-4 py-1 sm:py-1.5 bg-white/5 hover:bg-white/10 border-2 sm:border-4 border-black text-white/60 hover:text-white font-mono font-black text-[8px] sm:text-[10px] uppercase transition-all rounded-lg sm:rounded-xl">Reset</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* P1 상세 (모바일에서는 오버레이) */}
        {selectedPlayer && (
          <div className="md:shrink-0 absolute inset-0 md:relative z-40 bg-black/50 md:bg-transparent flex flex-col justify-end md:justify-center">
            <PokedexSidePanel 
              pokemon={selectedPlayer} 
              species={playerSpecies} 
              moves={playerMoves} 
              tab={playerPokedexTab} 
              onTabChange={setPlayerPokedexTab} 
              onEdit={() => openMoveEditModal('player1')} 
              onClose={() => setSelectedPlayer(null)}
            />
          </div>
        )}

        {/* 중앙 그리드 (반응형 열 개수) */}
        <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar relative z-10 bg-black/20">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6">
              <div className="w-10 h-10 sm:w-16 sm:h-16 border-[4px] sm:border-[6px] border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.3)]"></div>
              <p className="text-sm sm:text-lg font-mono text-white/40 uppercase font-black tracking-[0.3em] sm:tracking-[0.5em] animate-pulse">Syncing...</p>
            </div>
          ) : (
            <div className={`grid gap-2 sm:gap-4 transition-all duration-700 ${
              (selectedPlayer && selectedOpponent) 
                ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5' 
                : (selectedPlayer || selectedOpponent) 
                  ? 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-7' 
                  : 'grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
            }`}>
              {entries.map((entry) => {
                const id = entry.pokemon_species.url.split('/').filter(Boolean).pop();
                const isP1 = selectedPlayer?.name === entry.pokemon_species.name;
                const isP2 = selectedOpponent?.name === entry.pokemon_species.name;
                const displayName = localizedNames[entry.pokemon_species.name] || entry.pokemon_species.name;
                
                return (
                  <div key={entry.pokemon_species.name} onClick={() => handleSelect(entry)} className={`group relative p-0.5 sm:p-1 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-500 ${isP1 ? 'bg-blue-500 scale-95 shadow-[0_0_20px_#3b82f6]' : isP2 ? 'bg-red-600 scale-95 shadow-[0_0_20px_#dc2626]' : 'bg-white/5 hover:bg-white/10 hover:-translate-y-1 active:scale-95'}`}>
                    <div className="bg-black/30 border-2 border-white/5 rounded-lg sm:rounded-[1.2rem] p-2 sm:p-4 flex flex-col items-center relative overflow-hidden h-full min-h-[100px] sm:min-h-[160px] justify-center">
                      <div className="absolute top-1 right-2 text-[6px] sm:text-[8px] font-mono text-white/10 font-black">#{String(id).padStart(3, '0')}</div>
                      <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} className={`w-16 h-16 sm:w-24 sm:h-24 transition-transform duration-500 ${isP1 || isP2 ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'group-hover:scale-125'}`} style={{ imageRendering: 'pixelated' }} />
                      <h3 className={`mt-1 sm:mt-2 font-mono font-black text-[8px] sm:text-xs uppercase truncate w-full text-center tracking-tight transition-colors ${isP1 || isP2 ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{displayName}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* P2 상세 (모바일에서는 오버레이) */}
        {selectedOpponent && (
          <div className="md:shrink-0 absolute inset-0 md:relative z-40 bg-black/50 md:bg-transparent flex flex-col justify-end md:justify-center">
            <PokedexSidePanel 
              pokemon={selectedOpponent} 
              species={opponentSpecies} 
              moves={opponentMoves} 
              tab={opponentPokedexTab} 
              onTabChange={setOpponentPokedexTab} 
              onEdit={() => openMoveEditModal('player2')} 
              onClose={() => setSelectedOpponent(null)} 
              isOpponent
            />
          </div>
        )}
      </main>

      {/* 하단 컨트롤 패널 (반응형 최적화) */}
      <footer className="shrink-0 bg-[#1a1a1a] border-t-[4px] sm:border-t-[8px] border-black p-3 sm:p-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-10 shadow-2xl">
        <div className="w-full max-w-5xl flex items-center gap-4 sm:gap-10">
          <div className="flex-1 flex justify-around items-center bg-black/40 border-2 sm:border-4 border-white/5 p-2 sm:p-4 rounded-2xl sm:rounded-3xl shadow-inner relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border-2 sm:border-4 border-black px-3 py-0.5 rounded-full"><span className="text-[6px] sm:text-[8px] font-mono text-white/40 font-black tracking-[0.3em] sm:tracking-[0.5em] uppercase whitespace-nowrap">Combatant Ready</span></div>
            
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className={`w-14 h-14 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-500 flex items-center justify-center relative ${selectedPlayer ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_#3b82f6]' : 'bg-white/5 border-white/10 border-dashed opacity-40'}`}>
                {selectedPlayer && <img src={selectedPlayer.sprites.front_default} className="w-16 h-16 sm:w-28 sm:h-28 max-w-none absolute drop-shadow-lg" style={{ imageRendering: 'pixelated' }} />}
              </div>
              <span className="text-[7px] sm:text-[10px] font-mono text-white/60 font-black uppercase tracking-widest truncate max-w-[60px] sm:max-w-none">{selectedPlayer ? getLocalizedName(playerSpecies, selectedPlayer.name) : 'P1'}</span>
            </div>

            <div className="text-xl sm:text-4xl font-mono text-white/10 font-black select-none">VS</div>

            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className={`w-14 h-14 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-500 flex items-center justify-center relative ${selectedOpponent ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_#dc2626]' : 'bg-white/5 border-white/10 border-dashed opacity-40'}`}>
                {selectedOpponent && <img src={selectedOpponent.sprites.front_default} className="w-16 h-16 sm:w-28 sm:h-28 max-w-none absolute drop-shadow-lg" style={{ imageRendering: 'pixelated' }} />}
              </div>
              <span className="text-[7px] sm:text-[10px] font-mono text-white/60 font-black uppercase tracking-widest truncate max-w-[60px] sm:max-w-none">{selectedOpponent ? getLocalizedName(opponentSpecies, selectedOpponent.name) : 'P2'}</span>
            </div>
          </div>

          <button 
            onClick={() => router.push('/battle')} 
            disabled={!selectedPlayer || !selectedOpponent} 
            className="group relative px-6 sm:px-12 py-3 sm:py-5 bg-yellow-400 border-[4px] sm:border-[8px] border-black rounded-xl sm:rounded-[2rem] shadow-[5px_5px_0_0_#000] sm:shadow-[10px_10px_0_0_#000] active:shadow-none active:translate-x-1 sm:active:translate-x-2 active:translate-y-1 sm:active:translate-y-2 disabled:opacity-20 transition-all overflow-hidden flex-shrink-0"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative z-10 text-xs sm:text-2xl font-mono font-black text-black uppercase tracking-tighter">Initiate</span>
          </button>
        </div>
      </footer>

      {/* 기술 편집 모달 (반응형 사이즈) */}
      {isMoveModalOpen && editingPlayer && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-[#1a1a1a] border-[6px] sm:border-[10px] border-black rounded-[1.5rem] sm:rounded-[3rem] p-4 sm:p-10 w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>
            <div className="flex justify-between items-center mb-4 sm:mb-10">
               <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Configuration.Moves</span>
                  <h2 className="text-lg sm:text-4xl font-mono uppercase font-black text-white tracking-tighter leading-none">{t('Define Protocol')}</h2>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-6 bg-black/40 border-2 sm:border-4 border-white/5 rounded-xl sm:rounded-3xl custom-scrollbar shadow-inner">
              {availableMovesDetails.map((m: any) => {
                const isSelected = tempSelectedMoves.find(sm => sm.name === m.name);
                return (
                  <button key={m.name} onClick={() => toggleTempMove(m)} className={`group relative p-2 sm:p-4 border-2 sm:border-4 border-black font-mono text-left transition-all rounded-lg sm:rounded-2xl overflow-hidden ${isSelected ? 'bg-blue-500 scale-95 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]' : 'bg-white/5 hover:bg-white/10 shadow-[3px_3px_0_0_#000] sm:shadow-[6px_6px_0_0_#000]'}`}>
                    <div className="relative z-10">
                      <p className={`font-black text-[9px] sm:text-xs uppercase truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>{getLocalizedMoveName(m)}</p>
                      <div className="flex justify-between mt-1 sm:mt-2 text-[7px] sm:text-[9px] font-black opacity-60 text-white"><span>P: {m.power || '--'}</span><span>{m.type.name}</span></div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 sm:mt-10 flex flex-col sm:flex-row justify-end gap-3 sm:gap-6 items-center">
              <span className="sm:mr-auto font-mono text-white/30 text-[8px] sm:text-xs font-black uppercase tracking-widest">{tempSelectedMoves.length} / 4 Slots Filled</span>
              <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 sm:flex-none px-4 sm:px-10 py-2 sm:py-4 bg-white/5 border-2 sm:border-4 border-black text-white/60 font-mono font-black uppercase rounded-lg sm:rounded-2xl hover:bg-white/10 transition-all text-[10px] sm:text-base">Abort</button>
                <button onClick={confirmMoveSelection} disabled={tempSelectedMoves.length !== 4} className="flex-1 sm:flex-none px-4 sm:px-10 py-2 sm:py-4 bg-blue-500 border-2 sm:border-4 border-black font-mono font-black uppercase text-white rounded-lg sm:rounded-2xl shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] active:shadow-none active:translate-y-1 disabled:opacity-20 transition-all text-[10px] sm:text-base">Execute</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .animate-scan { animation: scan 3s linear infinite; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
