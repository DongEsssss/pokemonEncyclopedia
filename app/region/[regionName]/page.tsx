"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPokedexByRegion, getPokemon, Pokemon, PokedexEntry, getRandomMoves, MoveDetails, getMovesDetails, PokemonMove, PokemonSpecies, getPokemonSpecies } from '@/src/services/pokeapi';
import PokemonCard from '@/src/components/PokemonCard';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';

/**
 * 포켓몬 타입별 배경색 정의
 */
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

  // --- 상태 관리 ---
  const [entries, setEntries] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [localizedNames, setLocalizedNames] = useState<Record<string, string>>({});

  const { setPlayerPokemon, setOpponentPokemon, playerMoves, opponentMoves, setPlayerMoves, setOpponentMoves } = useBattle();
  const [selectedPlayer, setSelectedPlayer] = useState<Pokemon | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<Pokemon | null>(null);
  const [playerSpecies, setPlayerSpecies] = useState<PokemonSpecies | null>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<PokemonSpecies | null>(null);
  
  // 도감 디바이스 상세 창 열림 상태
  const [isP1DeviceOpen, setIsP1DeviceOpen] = useState(false);
  const [isP2DeviceOpen, setIsP2DeviceOpen] = useState(false);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [tempSelectedMoves, setTempSelectedMoves] = useState<MoveDetails[]>([]);
  const [availableMovesDetails, setAvailableMovesDetails] = useState<MoveDetails[]>([]);
  const [isLoadingAvailableMoves, setIsLoadingAvailableMoves] = useState(false);
  
  const [playerPokedexTab, setPlayerPokedexTab] = useState<'info' | 'moves'>('info');
  const [opponentPokedexTab, setOpponentPokedexTab] = useState<'info' | 'moves'>('info');

  // --- 현지화 유틸리티 ---
  const getLocalizedNameFromSpecies = (species: PokemonSpecies | null, defaultName: string) => {
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

  const getLocalizedMoveDescription = (move: MoveDetails) => {
    if (!move.flavor_text_entries) return '';
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const descObj = move.flavor_text_entries.find(f => f.language.name === lang) || 
                    move.flavor_text_entries.find(f => f.language.name === 'ko') || 
                    move.flavor_text_entries.find(f => f.language.name === 'en');
    return descObj ? descObj.flavor_text.replace(/[\n\f\r]/g, ' ') : '';
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
   * 도감 내 기술 카드
   */
  const MoveCard = ({ move }: { move: MoveDetails }) => (
    <div className={`p-2 rounded text-white font-mono border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col gap-1 ${typeColors[move.type.name] || 'bg-gray-400'}`}>
      <div className="flex justify-between items-start w-full gap-2">
        <span className="text-xs sm:text-sm uppercase font-bold break-words leading-tight" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>{getLocalizedMoveName(move)}</span>
        <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">{move.type.name}</span>
      </div>
      <div className="flex gap-2 text-[10px] opacity-90 mt-0.5">
        <span>{t('PWR')}: {move.power || '--'}</span>
        <span>{t('ACC')}: {move.accuracy || '--'}</span>
      </div>
      <span className="text-[10px] sm:text-[11px] leading-snug mt-1 pt-1 border-t border-white/30" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>{getLocalizedMoveDescription(move)}</span>
    </div>
  );

  /**
   * 통합 포켓몬 도감 컴포넌트
   */
  interface PokedexDeviceProps {
    pokemon: Pokemon;
    species: PokemonSpecies | null;
    moves: MoveDetails[];
    tab: 'info' | 'moves';
    onTabChange: (tab: 'info' | 'moves') => void;
    onEdit: () => void;
    onClose: () => void;
    isOpponent?: boolean;
  }

  const PokedexDevice = ({ pokemon, species, moves, tab, onTabChange, onEdit, onClose, isOpponent }: PokedexDeviceProps) => (
    <div className={`absolute bottom-full mb-8 ${isOpponent ? 'right-0' : 'left-0'} z-[100] transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in cursor-default`} onClick={e => e.stopPropagation()}>
      <div className="relative bg-[#DC0A2D] border-[6px] border-black rounded-3xl shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col w-[300px] sm:w-[380px]">
        <div className="p-4 pb-2 flex items-center justify-between border-b-4 border-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#28aafd] border-4 border-white shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5)]"></div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-black/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-black/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black/40"></div>
            </div>
          </div>
          <div className="flex bg-black/20 p-1 rounded-lg gap-1">
            <button onClick={() => onTabChange('info')} className={`px-3 py-1 font-mono text-[10px] uppercase font-bold rounded transition-all ${tab === 'info' ? 'bg-[#28aafd] text-white' : 'text-white/60 hover:text-white'}`}>{t('Info')}</button>
            <button onClick={() => onTabChange('moves')} className={`px-3 py-1 font-mono text-[10px] uppercase font-bold rounded transition-all ${tab === 'moves' ? 'bg-[#28aafd] text-white' : 'text-white/60 hover:text-white'}`}>{t('Moveset')}</button>
          </div>
          <button onClick={onClose} className="text-white hover:text-black font-bold text-xl px-2">✕</button>
        </div>
        <div className="p-4 bg-[#DC0A2D]">
          <div className="h-[420px] flex flex-col">
            {tab === 'info' ? (
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-[#98cb98] border-[6px] border-black rounded-xl p-4 flex flex-col items-center justify-center relative shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.2)]">
                  <div className="absolute top-2 right-3 text-[10px] font-mono text-black/40 font-bold">NO. {String(pokemon.id).padStart(3, '0')}</div>
                  <img src={pokemon.sprites.front_default} className="w-32 h-32 drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                  <h2 className="font-mono text-black uppercase font-black text-2xl tracking-tighter mt-1">{getLocalizedNameFromSpecies(species, pokemon.name)}</h2>
                  <div className="flex gap-2 mt-2">
                    {pokemon.types.map(t => (
                      <span key={t.type.name} className={`text-[10px] px-2 py-0.5 rounded uppercase text-white font-bold border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${typeColors[t.type.name] || 'bg-gray-400'}`}>{t.type.name}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="bg-black/80 border-4 border-black p-3 rounded-lg flex-1">
                    <p className="font-mono text-[11px] text-[#42F554] leading-relaxed line-clamp-4">{getLocalizedPokemonDescription(species)}</p>
                  </div>
                  <div className="flex gap-3 h-24">
                    <div className="flex-1 bg-[#28aafd] border-4 border-black p-2 rounded text-black font-mono text-[10px] flex flex-col justify-center">
                      <div className="flex justify-between border-b border-black/20 pb-0.5 mb-1"><span>{t('HT')}</span><span className="font-bold">{pokemon.height / 10}m</span></div>
                      <div className="flex justify-between"><span>{t('WT')}</span><span className="font-bold">{pokemon.weight / 10}kg</span></div>
                    </div>
                    <div className="flex-[2] bg-white border-4 border-black p-2 rounded grid grid-cols-2 gap-x-2 gap-y-1 text-left overflow-y-auto custom-scrollbar">
                      {pokemon.stats.map(s => (
                        <div key={s.stat.name} className="flex justify-between items-center text-[9px] font-mono leading-none">
                          <span className="uppercase text-gray-400">{t(s.stat.name)}</span>
                          <span className="font-bold">{s.base_stat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-[#DEDEDE] border-[6px] border-black rounded-xl p-3 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-mono text-black uppercase font-bold text-sm tracking-widest">{t('Moveset')}</h3>
                  <button onClick={onEdit} className="px-2 py-1 bg-yellow-400 border-2 border-black font-mono text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000] active:shadow-none">{t('Edit')}</button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  {moves.map(m => (<MoveCard key={m.id} move={m} />))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-12 bg-black/10 border-t-4 border-black/20 flex items-center justify-between px-6">
          <div className="w-8 h-8 rounded-full bg-[#333] border-4 border-black"></div>
          <div className="flex gap-1"><div className="w-8 h-2 bg-black/40 rounded-full"></div><div className="w-8 h-2 bg-black/40 rounded-full"></div></div>
        </div>
      </div>
      <div className={`absolute -bottom-4 ${isOpponent ? 'right-10' : 'left-10'} w-8 h-8 bg-[#DC0A2D] border-l-4 border-b-4 border-black -rotate-45 transform z-[-1]`}></div>
    </div>
  );

  // --- 이벤트 핸들러 및 데이터 로직 ---
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
      if (prev.find(m => m.name === move.name)) return prev.filter(m => m.name !== move.name);
      return prev.length < 4 ? [...prev, move] : prev;
    });
  };

  const confirmMoveSelection = async () => {
    if (tempSelectedMoves.length !== 4 || !editingPlayer) return;
    if (editingPlayer === 'player1') setPlayerMoves([...tempSelectedMoves]);
    else setOpponentMoves([...tempSelectedMoves]);
    setIsMoveModalOpen(false);
  };

  const fetchLocalizedNames = async (entries: PokedexEntry[]) => {
    const names: Record<string, string> = {};
    await Promise.all(entries.map(async (entry) => {
      try {
        const species = await getPokemonSpecies(entry.pokemon_species.name);
        names[entry.pokemon_species.name] = getLocalizedNameFromSpecies(species, entry.pokemon_species.name);
      } catch (e) {
        names[entry.pokemon_species.name] = entry.pokemon_species.name;
      }
    }));
    setLocalizedNames(names);
  };

  useEffect(() => {
    async function loadRegion() {
      try {
        const data = await getPokedexByRegion(regionName);
        setEntries(data);
        fetchLocalizedNames(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadRegion();
  }, [regionName]);

  const handleSelect = async (entry: PokedexEntry) => {
    const pkmn = await getPokemon(entry.pokemon_species.name);
    const species = await getPokemonSpecies(entry.pokemon_species.name);

    if (selectedPlayer?.name === pkmn.name) {
      setSelectedPlayer(null); setPlayerPokemon(null); setPlayerMoves([]); setIsP1DeviceOpen(false); return;
    }
    if (selectedOpponent?.name === pkmn.name) {
      setSelectedOpponent(null); setOpponentPokemon(null); setOpponentMoves([]); setIsP2DeviceOpen(false); return;
    }

    if (!selectedPlayer) {
      setSelectedPlayer(pkmn); setPlayerPokemon(pkmn); setPlayerSpecies(species);
      getRandomMoves(pkmn.moves, 4).then(setPlayerMoves);
      setIsP1DeviceOpen(true); // 처음 선택 시 디바이스 열기
    } else if (!selectedOpponent) {
      setSelectedOpponent(pkmn); setOpponentPokemon(pkmn); setOpponentSpecies(species);
      getRandomMoves(pkmn.moves, 4).then(setOpponentMoves);
      setIsP2DeviceOpen(true); // 처음 선택 시 디바이스 열기
    }
  };

  return (
    <div className={`min-h-screen ${regionName.toLowerCase() === 'kanto' ? 'bg-green-300' : 'bg-blue-100'}`} style={{ backgroundImage: 'radial-gradient(#00000022 2px, transparent 2px)', backgroundSize: '24px 24px' }}>
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <h1 className="text-2xl sm:text-4xl font-mono uppercase tracking-widest mb-8 text-center text-black" style={{ textShadow: '2px 2px 0px white' }}>{t('Region Pokedex', { region: regionName })}</h1>
        <div className="w-full pb-64"> {/* 하단바 공간 확보 위해 여백 증가 */}
          {loading ? (
            <p className="text-center font-mono text-xl animate-pulse">{t('Loading Pokedex...')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
              {entries.map((entry) => {
                const id = entry.pokemon_species.url.split('/').filter(Boolean).pop();
                const isPlayer = selectedPlayer?.name === entry.pokemon_species.name;
                const isOpponent = selectedOpponent?.name === entry.pokemon_species.name;
                const displayName = localizedNames[entry.pokemon_species.name] || entry.pokemon_species.name;
                
                return (
                  <div key={entry.pokemon_species.name} onClick={() => handleSelect(entry)} className={`p-3 border-4 border-black rounded-2xl cursor-pointer transition-all ${isPlayer ? 'bg-blue-100 ring-4 ring-blue-500 scale-105 shadow-[6px_6px_0_0_#2563eb]' : isOpponent ? 'bg-red-100 ring-4 ring-red-500 scale-105 shadow-[6px_6px_0_0_#dc2626]' : 'bg-white shadow-[4px_4px_0_0_#000] hover:scale-105'}`}>
                    <div className="bg-gray-100 rounded-xl mb-3 flex justify-center p-2 border-2 border-black relative">
                      <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} className="w-20 h-20" style={{ imageRendering: 'pixelated' }} />
                      <span className="absolute top-1 right-1 text-[8px] font-mono text-black/40 font-bold">#{id}</span>
                    </div>
                    <h3 className="text-center font-mono font-bold text-[10px] sm:text-xs uppercase truncate px-1" title={displayName}>{displayName}</h3>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#dc0a2d] border-t-[8px] border-black">
        <div className="w-full h-2 bg-[#ff6b8b] border-b-4 border-black"></div>
        <div className="container mx-auto px-4 py-6 max-w-[1400px] flex justify-between items-center gap-6">
          
          <div className={`flex-1 flex items-center p-4 border-[6px] border-black rounded-xl relative ${selectedPlayer ? 'bg-[#1e3a8a]' : 'bg-[#1e3a8a] border-dashed opacity-80'}`}>
            {selectedPlayer && isP1DeviceOpen && (
              <PokedexDevice 
                pokemon={selectedPlayer} 
                species={playerSpecies} 
                moves={playerMoves} 
                tab={playerPokedexTab} 
                onTabChange={setPlayerPokedexTab} 
                onEdit={() => openMoveEditModal('player1')} 
                onClose={() => setIsP1DeviceOpen(false)} 
              />
            )}
            
            <div onClick={() => selectedPlayer ? setIsP1DeviceOpen(!isP1DeviceOpen) : null} className={`w-24 h-24 sm:w-32 sm:h-32 bg-[#98cb98] border-4 border-black rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.2)] ${selectedPlayer ? 'cursor-pointer hover:bg-[#a8dbb8]' : ''}`}>
              <div className="absolute inset-0 opacity-10 rounded-sm bg-[linear-gradient(rgba(0,0,0,0.1)_1px,_transparent_1px)] pointer-events-none" style={{ backgroundSize: '100% 4px' }}></div>
              <div key={selectedPlayer?.name || 'empty-p1'} className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-10 ${selectedPlayer ? 'animate-throw-left' : ''}`}>
                <div className="absolute inset-0 origin-bottom" style={{ zIndex: selectedPlayer ? 10 : 20, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', animation: selectedPlayer ? 'openTop 0.3s ease-out 0.8s both' : 'none' }}>
                  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball top" />
                </div>
                <div className="absolute inset-0 origin-top" style={{ zIndex: 20, clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', animation: selectedPlayer ? 'openBottom 0.3s ease-out 0.8s both' : 'none' }}>
                  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball bottom" />
                </div>
                {selectedPlayer && (
                  <div className="absolute z-30" style={{ animation: 'popOut 0.4s ease-out 0.9s both', top: '-10px' }}>
                    <img src={selectedPlayer.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 max-w-none object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)] animate-bounce" style={{ imageRendering: 'pixelated' }} alt="P1 Pokemon" />
                  </div>
                )}
              </div>
              {selectedPlayer && !isP1DeviceOpen && (
                <div className="absolute bottom-1 right-1 bg-white/80 border-2 border-black rounded px-1 animate-bounce">
                  <span className="text-[8px] font-mono font-black text-black">INFO ▲</span>
                </div>
              )}
            </div>

            <div className="ml-6 text-white font-mono hidden lg:block">
              <p className="text-xs font-bold opacity-70">PLAYER 1</p>
              <h3 className="text-xl font-black uppercase truncate max-w-[150px]">{getLocalizedNameFromSpecies(playerSpecies, selectedPlayer?.name || '') || t('Select P1')}</h3>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
             <button onClick={() => router.push('/battle')} disabled={!selectedPlayer || !selectedOpponent} className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400 border-[8px] border-black rounded-full shadow-[0_6px_0_0_#000] font-mono font-black text-xl sm:text-2xl active:translate-y-1 active:shadow-none disabled:opacity-30 flex items-center justify-center text-center px-2 leading-tight transition-all">배틀 시작</button>
             <button onClick={() => { setSelectedPlayer(null); setSelectedOpponent(null); setPlayerPokemon(null); setOpponentPokemon(null); setIsP1DeviceOpen(false); setIsP2DeviceOpen(false); }} className="text-[10px] font-mono font-bold text-white/50 hover:text-white uppercase tracking-tighter">{t('Reset')}</button>
          </div>

          <div className={`flex-1 flex items-center flex-row-reverse p-4 border-[6px] border-black rounded-xl relative ${selectedOpponent ? 'bg-[#b90020]' : 'bg-[#b90020] border-dashed opacity-80'}`}>
            {selectedOpponent && isP2DeviceOpen && (
              <PokedexDevice 
                pokemon={selectedOpponent} 
                species={opponentSpecies} 
                moves={opponentMoves} 
                tab={opponentPokedexTab} 
                onTabChange={setOpponentPokedexTab} 
                onEdit={() => openMoveEditModal('player2')} 
                onClose={() => setIsP2DeviceOpen(false)} 
                isOpponent 
              />
            )}
            <div onClick={() => selectedOpponent ? setIsP2DeviceOpen(!isP2DeviceOpen) : null} className={`w-24 h-24 sm:w-32 sm:h-32 bg-[#98cb98] border-4 border-black rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.2)] ${selectedOpponent ? 'cursor-pointer hover:bg-[#a8dbb8]' : ''}`}>
              <div className="absolute inset-0 opacity-10 rounded-sm bg-[linear-gradient(rgba(0,0,0,0.1)_1px,_transparent_1px)] pointer-events-none" style={{ backgroundSize: '100% 4px' }}></div>
              <div key={selectedOpponent?.name || 'empty-p2'} className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-10 ${selectedOpponent ? 'animate-throw-right' : ''}`}>
                <div className="absolute inset-0 origin-bottom" style={{ zIndex: selectedOpponent ? 10 : 20, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', animation: selectedOpponent ? 'openTop 0.3s ease-out 0.8s both' : 'none' }}>
                  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball top" />
                </div>
                <div className="absolute inset-0 origin-top" style={{ zIndex: 20, clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', animation: selectedOpponent ? 'openBottom 0.3s ease-out 0.8s both' : 'none' }}>
                  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-full h-full drop-shadow-md" style={{ imageRendering: 'pixelated' }} alt="pokeball bottom" />
                </div>
                {selectedOpponent && (
                  <div className="absolute z-30" style={{ animation: 'popOut 0.4s ease-out 0.9s both', top: '-10px' }}>
                    <img src={selectedOpponent.sprites.front_default} className="w-24 h-24 sm:w-32 sm:h-32 max-w-none object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)] animate-bounce" style={{ imageRendering: 'pixelated' }} alt="P2 Pokemon" />
                  </div>
                )}
              </div>
              {selectedOpponent && !isP2DeviceOpen && (
                <div className="absolute bottom-1 left-1 bg-white/80 border-2 border-black rounded px-1 animate-bounce">
                  <span className="text-[8px] font-mono font-black text-black">INFO ▲</span>
                </div>
              )}
            </div>
            <div className="mr-6 text-white font-mono text-right hidden lg:block">
              <p className="text-xs font-bold opacity-70">PLAYER 2</p>
              <h3 className="text-xl font-black uppercase truncate max-w-[150px]">{getLocalizedNameFromSpecies(opponentSpecies, selectedOpponent?.name || '') || t('Select P2')}</h3>
            </div>
          </div>
        </div>
      </div>

      {isMoveModalOpen && editingPlayer && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-[8px] border-black rounded-2xl p-8 w-full max-w-3xl flex flex-col max-h-[90vh]">
            <h2 className="text-3xl font-mono uppercase font-black mb-6">{t('Select 4 Moves')}</h2>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border-4 border-black bg-gray-50">
              {availableMovesDetails.map(m => {
                const isSelected = tempSelectedMoves.find(sm => sm.name === m.name);
                return (
                  <button key={m.name} onClick={() => toggleTempMove(m)} className={`p-3 border-4 border-black font-mono text-left transition-all ${isSelected ? 'bg-green-400 scale-95' : 'bg-white hover:bg-gray-100'}`}>
                    <p className="font-bold text-xs uppercase">{getLocalizedMoveName(m)}</p>
                    <p className="text-[10px] opacity-60">PWR: {m.power || '--'}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => setIsMoveModalOpen(false)} className="px-6 py-2 bg-gray-300 border-4 border-black font-mono font-bold uppercase">{t('Cancel')}</button>
              <button onClick={confirmMoveSelection} disabled={tempSelectedMoves.length !== 4} className="px-6 py-2 bg-yellow-400 border-4 border-black font-mono font-bold uppercase shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 disabled:opacity-50">{t('Confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
