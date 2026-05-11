"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';
import { getRandomMoves, MoveDetails, PokemonSpecies, getPokemonSpecies } from '@/src/services/pokeapi';

/**
 * 타입별 네온 테마
 */
const typeThemes: Record<string, { main: string, neon: string }> = {
  normal: { main: '#A8A878', neon: 'rgba(168, 168, 120, 0.4)' },
  fire: { main: '#F08030', neon: 'rgba(240, 128, 48, 0.4)' },
  water: { main: '#6890F0', neon: 'rgba(104, 144, 240, 0.4)' },
  grass: { main: '#78C850', neon: 'rgba(120, 200, 80, 0.4)' },
  electric: { main: '#F8D030', neon: 'rgba(248, 208, 48, 0.4)' },
  ice: { main: '#98D8D8', neon: 'rgba(152, 216, 216, 0.4)' },
  fighting: { main: '#C03028', neon: 'rgba(192, 48, 40, 0.4)' },
  poison: { main: '#A040A0', neon: 'rgba(160, 64, 160, 0.4)' },
  ground: { main: '#E0C068', neon: 'rgba(224, 192, 104, 0.4)' },
  flying: { main: '#A890F0', neon: 'rgba(168, 144, 240, 0.4)' },
  psychic: { main: '#F85888', neon: 'rgba(248, 88, 136, 0.4)' },
  bug: { main: '#A8B820', neon: 'rgba(168, 184, 32, 0.4)' },
  rock: { main: '#B8A038', neon: 'rgba(184, 160, 56, 0.4)' },
  ghost: { main: '#705898', neon: 'rgba(112, 88, 152, 0.4)' },
  dragon: { main: '#7038F8', neon: 'rgba(112, 56, 248, 0.4)' },
  dark: { main: '#705848', neon: 'rgba(112, 88, 72, 0.4)' },
  steel: { main: '#B8B8D0', neon: 'rgba(184, 184, 208, 0.4)' },
  fairy: { main: '#EE99AC', neon: 'rgba(238, 153, 172, 0.4)' }
};

const typeChart: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, water: 1, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

const getMultiplier = (attackType: string, defenderTypes: any[]) => {
  let multiplier = 1;
  defenderTypes.forEach(d => {
    const dType = d.type.name;
    if (typeChart[attackType] && typeChart[attackType][dType] !== undefined) {
      multiplier *= typeChart[attackType][dType];
    }
  });
  return multiplier;
};

export default function BattlePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { playerPokemon, opponentPokemon, playerMoves: contextPlayerMoves, opponentMoves: contextOpponentMoves, resetBattle } = useBattle();
  
  const [logs, setLogs] = useState<string[]>([]);
  const [battleOver, setBattleOver] = useState(false);
  const [playerHp, setPlayerHp] = useState<number>(0);
  const [oppHp, setOppHp] = useState<number>(0);
  
  const [playerMoves, setPlayerMoves] = useState<MoveDetails[]>([]);
  const [opponentMoves, setOpponentMoves] = useState<MoveDetails[]>([]);
  const [playerSpecies, setPlayerSpecies] = useState<PokemonSpecies | null>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<PokemonSpecies | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [damageEffect, setDamageEffect] = useState<'p1' | 'p2' | null>(null);

  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!playerPokemon || !opponentPokemon) {
      router.push('/');
      return;
    }

    const initBattle = async () => {
      let currentPHp = playerPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
      let currentOHp = opponentPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
      currentPHp *= 3;
      currentOHp *= 3;
      setPlayerHp(currentPHp);
      setOppHp(currentOHp);
      
      try {
        const [pSpecies, oSpecies] = await Promise.all([
          getPokemonSpecies(playerPokemon.name),
          getPokemonSpecies(opponentPokemon.name)
        ]);
        setPlayerSpecies(pSpecies);
        setOpponentSpecies(oSpecies);

        const pMoves = contextPlayerMoves?.length ? contextPlayerMoves : await getRandomMoves(playerPokemon.moves, 4);
        const oMoves = contextOpponentMoves?.length ? contextOpponentMoves : await getRandomMoves(opponentPokemon.moves, 4);
        setPlayerMoves(pMoves);
        setOpponentMoves(oMoves);

        setLogs([
          t('Battle Start!'),
          t('Go, {{name}}!', { name: getLocalizedName(pSpecies, playerPokemon.name) }),
          t('Go, {{name}}!', { name: getLocalizedName(oSpecies, opponentPokemon.name) })
        ]);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    initBattle();
  }, [playerPokemon, opponentPokemon, router, t]);

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

  const executeTurn = async (move: MoveDetails) => {
    if (isProcessing || battleOver) return;
    setIsProcessing(true);
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
    const isPlayer1 = currentTurn === 'player1';
    const attacker = isPlayer1 ? playerPokemon! : opponentPokemon!;
    const defender = isPlayer1 ? opponentPokemon! : playerPokemon!;
    const attackerSpecies = isPlayer1 ? playerSpecies : opponentSpecies;
    const defenderSpecies = isPlayer1 ? opponentSpecies : playerSpecies;
    const attackerAtk = attacker.stats.find(s => s.stat.name === 'attack')?.base_stat || 10;
    const defenderDef = defender.stats.find(s => s.stat.name === 'defense')?.base_stat || 10;
    const moveName = getLocalizedMoveName(move);
    const attackerName = getLocalizedName(attackerSpecies, attacker.name);
    
    setLogs(prev => [...prev, t('{{name}} used {{move}}!', { name: attackerName, move: moveName })]);
    await wait(800);
    
    const multiplier = getMultiplier(move.type.name, defender.types);
    const power = move.power || 50;
    const damage = Math.max(1, Math.floor(((power * attackerAtk / defenderDef) / 2) * multiplier * (attacker.types.some(t => t.type.name === move.type.name) ? 1.5 : 1)));
    
    setDamageEffect(isPlayer1 ? 'p2' : 'p1');
    if (isPlayer1) {
      const newHp = Math.max(0, oppHp - damage);
      setOppHp(newHp);
      if (multiplier > 1) setLogs(prev => [...prev, t("It's super effective!")]);
      else if (multiplier < 1 && multiplier > 0) setLogs(prev => [...prev, t("It's not very effective...")]);
      else if (multiplier === 0) setLogs(prev => [...prev, t("It had no effect!")]);
      if (multiplier !== 1) await wait(600);
      setLogs(prev => [...prev, t('Dealt {{damage}} damage!', { damage })]);
      if (newHp <= 0) {
        await wait(1000);
        setLogs(prev => [...prev, t('Opponent {{name}} fainted! Player 1 wins!', { name: getLocalizedName(defenderSpecies, defender.name) })]);
        setBattleOver(true); setIsProcessing(false); setDamageEffect(null); return;
      }
    } else {
      const newHp = Math.max(0, playerHp - damage);
      setPlayerHp(newHp);
      if (multiplier > 1) setLogs(prev => [...prev, t("It's super effective!")]);
      else if (multiplier < 1 && multiplier > 0) setLogs(prev => [...prev, t("It's not very effective...")]);
      else if (multiplier === 0) setLogs(prev => [...prev, t("It had no effect!")]);
      if (multiplier !== 1) await wait(600);
      setLogs(prev => [...prev, t('Dealt {{damage}} damage!', { damage })]);
      if (newHp <= 0) {
        await wait(1000);
        setLogs(prev => [...prev, t('{{name}} fainted! Player 2 wins!', { name: getLocalizedName(defenderSpecies, defender.name) })]);
        setBattleOver(true); setIsProcessing(false); setDamageEffect(null); return;
      }
    }
    await wait(600);
    setDamageEffect(null);
    await wait(400);
    setCurrentTurn(isPlayer1 ? 'player2' : 'player1');
    setIsProcessing(false);
  };

  if (!playerPokemon || !opponentPokemon) return null;

  const getStat = (pkmn: any, s: string) => pkmn.stats.find((st: any) => st.stat.name === s)?.base_stat || 0;
  const maxPlayerHp = (getStat(playerPokemon, 'hp') || 50) * 3;
  const maxOppHp = (getStat(opponentPokemon, 'hp') || 50) * 3;
  const getHpPercentage = (c: number, m: number) => Math.max(0, Math.min(100, (c / m) * 100));
  const getHpColor = (p: number) => p > 50 ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : p > 20 ? 'bg-yellow-400 shadow-[0_0_10px_#facc15]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]';

  const activeMoves = currentTurn === 'player1' ? playerMoves : opponentMoves;
  const activePlayerName = currentTurn === 'player1' ? t('Player 1') : t('Player 2');

  return (
    <div className="h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col selection:bg-blue-500">
      
      {/* 백그라운드 그리드 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} className="absolute inset-0"></div>
      </div>

      {/* 시스템 헤더 (반응형 최적화) */}
      <header className="z-50 bg-[#1a1a1a]/80 backdrop-blur-xl border-b-[4px] sm:border-b-[6px] border-black px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-6">
          <div onClick={() => router.back()} className="cursor-pointer group flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 border-2 sm:border-4 border-black rounded-lg sm:rounded-xl shadow-[3px_3px_0_0_#000] group-hover:translate-x-1 transition-all flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] sm:text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-0.5 sm:mb-1 leading-none">Simulation Active</span>
              <h1 className="text-sm sm:text-xl font-mono text-white uppercase font-black tracking-tighter leading-none">{t('Battle Arena')}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
           <div className="hidden xs:flex flex-col items-end mr-2 sm:mr-4">
              <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Latency</span>
              <span className="text-[8px] sm:text-[10px] font-mono text-green-500 font-bold">12ms</span>
           </div>
           <div className="w-[1px] sm:w-[2px] h-6 sm:h-8 bg-white/10"></div>
           <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"></div>
           </div>
        </div>
      </header>

      {/* 메인 시뮬레이션 섹션 */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 lg:p-6 gap-3 sm:gap-6 relative overflow-hidden">
        
        {/* 가상 배틀 필드 (반응형 포지셔닝) */}
        <div className="flex-1 relative bg-black/40 border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
           <div className="absolute inset-0 bg-[#0a0a1a] overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1e3a8a 0%, transparent 80%)' }}></div>
              <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-[#0f172a] to-transparent"></div>
              <div className="absolute inset-0 w-full h-full animate-scan pointer-events-none opacity-5 bg-gradient-to-b from-blue-400 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 w-full h-1/2 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent, rgba(255,255,255,0.1) 90%), linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 90%)', backgroundSize: '100px 40px', transform: 'perspective(500px) rotateX(60deg)' }}></div>
           </div>

           {/* 상대방 포켓몬 (반응형 크기/위치) */}
           <div className="absolute top-[5%] right-[5%] sm:top-[10%] sm:right-[10%] flex flex-col items-end gap-2 sm:gap-3 z-10 animate-in slide-in-from-right duration-700">
              <div className="bg-[#1a1a1a]/80 backdrop-blur-md border-2 border-white/10 p-2 sm:p-3 rounded-bl-[1.5rem] sm:rounded-bl-[2rem] rounded-tr-lg shadow-2xl min-w-[160px] sm:min-w-[220px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30"></div>
                <div className="flex justify-between items-end mb-1 sm:mb-2 border-b border-white/5 pb-1">
                  <span className="font-mono font-black text-[10px] sm:text-sm uppercase text-white tracking-tighter truncate max-w-[100px]">{getLocalizedName(opponentSpecies, opponentPokemon.name)}</span>
                  <span className="font-mono text-[7px] sm:text-[9px] font-black text-red-500 uppercase">Hostile</span>
                </div>
                <div className="w-full bg-black/50 h-2 sm:h-3 rounded-full overflow-hidden flex items-center p-[1px] sm:p-[2px] border border-white/10">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getHpColor(getHpPercentage(oppHp, maxOppHp))}`} style={{ width: `${getHpPercentage(oppHp, maxOppHp)}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 font-mono text-[7px] sm:text-[9px] font-black text-white/40">
                  <div className="hidden sm:flex gap-1">{opponentPokemon.types.map(t => <span key={t.type.name} className="px-1.5 py-0.5 bg-white/5 rounded-md uppercase border border-white/10">{t.type.name}</span>)}</div>
                  <span className="text-white/60 tracking-widest">{Math.max(0, oppHp)} / {maxOppHp}</span>
                </div>
              </div>
              <div className={`relative transition-all duration-300 ${damageEffect === 'p2' ? 'animate-shake' : ''}`}>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-6 sm:h-10 bg-blue-500/10 rounded-[50%] blur-2xl animate-pulse"></div>
                <img src={opponentPokemon.sprites.front_default} className={`w-32 h-32 sm:w-64 sm:h-64 relative z-10 transition-transform duration-500 ${currentTurn === 'player2' ? 'scale-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'scale-100 opacity-80'}`} style={{ imageRendering: 'pixelated' }} />
              </div>
           </div>

           {/* 플레이어 포켓몬 (반응형 크기/위치) */}
           <div className="absolute bottom-[8%] left-[5%] sm:bottom-[12%] sm:left-[10%] flex flex-col items-start gap-2 sm:gap-3 z-10 animate-in slide-in-from-left duration-700">
              <div className={`relative transition-all duration-300 ${damageEffect === 'p1' ? 'animate-shake' : ''}`}>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 sm:w-56 h-8 sm:h-12 bg-blue-500/10 rounded-[50%] blur-2xl animate-pulse"></div>
                <img src={playerPokemon.sprites.front_default} className={`w-40 h-40 sm:w-80 sm:h-80 relative z-10 transition-transform duration-500 scale-x-[-1] ${currentTurn === 'player1' ? 'scale-x-[-1.1] scale-y-[1.1] drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'scale-x-[-1] opacity-80'}`} style={{ imageRendering: 'pixelated' }} />
              </div>
              <div className="bg-[#1a1a1a]/80 backdrop-blur-md border-2 border-white/10 p-2 sm:p-4 rounded-br-[1.5rem] sm:rounded-br-[2rem] rounded-tl-lg shadow-2xl min-w-[180px] sm:min-w-[250px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/30"></div>
                <div className="flex justify-between items-end mb-1 sm:mb-2 border-b border-white/5 pb-1">
                  <span className="font-mono font-black text-xs sm:text-lg uppercase text-white tracking-tighter truncate max-w-[120px]">{getLocalizedName(playerSpecies, playerPokemon.name)}</span>
                  <span className="font-mono text-[8px] sm:text-[10px] font-black text-blue-400 uppercase">Ally</span>
                </div>
                <div className="w-full bg-black/50 h-3 sm:h-4 rounded-full overflow-hidden flex items-center p-[1px] sm:p-[2px] border border-white/10">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getHpColor(getHpPercentage(playerHp, maxPlayerHp))}`} style={{ width: `${getHpPercentage(playerHp, maxPlayerHp)}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 sm:mt-2 font-mono text-[8px] sm:text-[10px] font-black text-white/40">
                  <div className="hidden sm:flex gap-1.5">{playerPokemon.types.map(t => <span key={t.type.name} className="px-2 py-0.5 bg-white/5 rounded-md uppercase border border-white/10">{t.type.name}</span>)}</div>
                  <span className="text-white/60 tracking-[0.1em] sm:tracking-[0.2em]">{Math.max(0, playerHp)} / {maxPlayerHp}</span>
                </div>
              </div>
           </div>

           {/* 턴 오버레이 */}
           {!battleOver && !loading && (
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-50 pointer-events-none px-4">
               <div className={`px-6 sm:px-12 py-2 sm:py-3 bg-black/60 border-y-2 sm:border-y-4 border-blue-500/30 backdrop-blur-xl transition-all duration-500 transform ${isProcessing ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                 <p className="font-mono text-white text-sm sm:text-2xl font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase animate-pulse text-center">{activePlayerName} DECISION</p>
               </div>
             </div>
           )}
        </div>

        {/* 하단 제어 센터 (모바일/데스크탑 반응형 슬라이딩) */}
        <div className="h-44 sm:h-56 shrink-0 relative w-full overflow-hidden">
          
          {/* 커맨드 콘솔 */}
          <div 
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out z-20 border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 flex flex-col shadow-2xl ${
              currentTurn === 'player1' 
                ? 'left-0 w-[calc(65%-0.5rem)] sm:w-[calc(65%-0.75rem)] bg-blue-900/20 shadow-[0_0_40px_rgba(59,130,246,0.2)]' 
                : 'left-[calc(35%+0.5rem)] sm:left-[calc(35%+0.75rem)] w-[calc(65%-0.5rem)] sm:w-[calc(65%-0.75rem)] bg-red-900/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]'
            }`}
          >
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 sm:px-4 sm:py-1 bg-black border-2 border-white/10 rounded-full z-30">
                <span className={`text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] ${currentTurn === 'player1' ? 'text-blue-400' : 'text-red-500'}`}>
                  {currentTurn === 'player1' ? 'P1_ACTIVE' : 'P2_ACTIVE'}
                </span>
             </div>

             {loading ? (
                <div className="flex-1 flex items-center justify-center flex-col gap-2">
                   <div className="w-6 h-6 sm:w-10 sm:h-10 border-2 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-[8px] sm:text-[10px] font-mono text-white/40 uppercase tracking-widest">Loading...</span>
                </div>
             ) : battleOver ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                   <div className="text-sm sm:text-2xl font-mono font-black text-black uppercase bg-yellow-400 px-4 sm:px-8 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 sm:border-4 border-black shadow-[4px_4px_0_0_#000]">{t('Battle Ended')}</div>
                   <button onClick={() => { resetBattle(); router.back(); }} className="px-6 sm:px-10 py-2 sm:py-3 bg-blue-600 text-white border-2 sm:border-4 border-black rounded-lg sm:rounded-xl font-mono font-black uppercase text-[10px] sm:text-sm shadow-[4px_4px_0_0_#000] hover:bg-blue-500 active:translate-y-0.5 active:shadow-none transition-all">
                     {t('Restart')}
                   </button>
                </div>
             ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 h-full overflow-hidden">
                   {activeMoves.map((move, idx) => (
                     <button
                       key={`${move.name}-${idx}`}
                       disabled={isProcessing}
                       onClick={() => executeTurn(move)}
                       className={`group relative h-full p-2 sm:p-3 border-2 sm:border-4 border-black rounded-lg sm:rounded-2xl shadow-[3px_3px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all flex flex-col justify-center overflow-hidden disabled:opacity-20`}
                       style={{ backgroundColor: typeThemes[move.type.name]?.main || '#555' }}
                     >
                       <div className="absolute top-0.5 right-1 px-1 sm:px-2 py-0.5 bg-black/30 rounded text-[6px] sm:text-[8px] font-mono font-black text-white uppercase tracking-widest">{move.type.name}</div>
                       <div className="relative z-10 text-left">
                         <p className="font-mono font-black text-[9px] sm:text-lg text-white uppercase tracking-tighter truncate pr-6 sm:pr-10">{getLocalizedMoveName(move)}</p>
                         <div className="hidden sm:flex gap-3 mt-1.5 opacity-60 font-mono text-[9px] font-black text-white border-t border-white/10 pt-1">
                           <span>PWR: {move.power || '--'}</span>
                           <span>ACC: {move.accuracy || '--'}</span>
                         </div>
                       </div>
                       <div className={`absolute bottom-0 left-0 w-full h-0.5 sm:h-1 ${currentTurn === 'player1' ? 'bg-blue-400' : 'bg-red-500'} opacity-40`}></div>
                     </button>
                   ))}
                </div>
             )}
          </div>

          {/* 배틀 데이터 로그 (반응형 사이징) */}
          <div 
            ref={logBoxRef} 
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out z-10 bg-[#0a0a0a] border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 overflow-y-auto shadow-inner custom-scrollbar ${
              currentTurn === 'player1' 
                ? 'right-0 w-[calc(35%-0.5rem)] sm:w-[calc(35%-0.75rem)]' 
                : 'right-[calc(65%+0.5rem)] sm:right-[calc(65%+0.75rem)] w-[calc(35%-0.5rem)] sm:w-[calc(35%-0.75rem)]'
            }`}
          >
             <div className="absolute top-1.5 right-3 text-[6px] sm:text-[8px] font-black text-white/10 uppercase tracking-widest">Live</div>
             {logs.map((log, i) => (
                <div key={i} className="flex gap-1.5 sm:gap-3 mb-1.5 sm:mb-2.5 items-start animate-in fade-in slide-in-from-bottom-1 sm:slide-in-from-bottom-2 duration-300">
                  <span className="text-blue-400 font-mono text-[10px] sm:text-sm opacity-50">»</span>
                  <p className="font-mono text-blue-400 text-[8px] sm:text-[13px] uppercase tracking-tighter leading-tight font-black drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]">{log}</p>
                </div>
             ))}
          </div>
        </div>
      </main>

      {/* 시스템 푸터 (반응형 최적화) */}
      <footer className="shrink-0 bg-[#1a1a1a] border-t-[4px] sm:border-t-[8px] border-black px-4 sm:px-12 py-2 sm:py-3 flex justify-between items-center shadow-2xl">
         <div className="flex gap-4 sm:gap-8">
            <div className="flex flex-col">
              <span className="text-[6px] sm:text-[7px] font-black text-white/30 uppercase tracking-widest">Sim.Core</span>
              <span className="text-[8px] sm:text-[10px] font-mono text-white font-black uppercase text-blue-400">PKE-v1.2</span>
            </div>
            <div className="hidden xs:flex flex-col">
              <span className="text-[6px] sm:text-[7px] font-black text-white/30 uppercase tracking-widest">Entropy</span>
              <span className="text-[8px] sm:text-[10px] font-mono text-white font-black uppercase">0.0215</span>
            </div>
         </div>
         <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:block text-[10px] font-mono text-white/20 font-black uppercase tracking-widest">System Authorized</span>
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500/40"></div>
               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500/40"></div>
               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .animate-scan { animation: scan 6s linear infinite; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-0.5deg); }
          75% { transform: translateX(4px) rotate(0.5deg); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
