"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';
import { getRandomMoves, getPokemonSpecies, getFixedMovesDetailsByNames } from '@/src/services/pokeapi';
import { typeThemes } from '@/src/constants/pokemonData';
import { getMultiplier, calculateDamage, getStatValue, getHpPercentage, getHpColor } from '@/src/utils/battleUtils';
import { MoveDetails, PokemonSpecies } from '@/src/types/pokemon';
import { Turn, StatusEffect } from '@/src/types/battle';


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

  const [currentTurn, setCurrentTurn] = useState<Turn>('player1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [damageEffect, setDamageEffect] = useState<'p1' | 'p2' | null>(null);
  const [hitDamage, setHitDamage] = useState<{ value: number; type: 'p1' | 'p2' } | null>(null);
  const [attackAnim, setAttackAnim] = useState<'p1' | 'p2' | null>(null);
  const [motionType, setMotionType] = useState<'physical' | 'special'>('physical');
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [hitFlash, setHitFlash] = useState<'p1' | 'p2' | null>(null);
  const [lastMultiplier, setLastMultiplier] = useState<number>(1);

  const [playerStatus, setPlayerStatus] = useState<StatusEffect>(null);
  const [oppStatus, setOppStatus] = useState<StatusEffect>(null);
  const [fainting, setFainting] = useState<'p1' | 'p2' | null>(null);
  const [winner, setWinner] = useState<{ player: string; pokemon: string } | null>(null);


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
    const attackerAtk = getStatValue(attacker, 'attack') || 10;
    const defenderDef = getStatValue(defender, 'defense') || 10;
    const moveName = getLocalizedMoveName(move);
    const attackerName = getLocalizedName(attackerSpecies, attacker.name);

    if (attacker.name === 'magikarp' && move.name === 'splash') {
      setAttackAnim(isPlayer1 ? 'p1' : 'p2');
      await wait(200);
      setLogs(prev => [...prev, t('{{name}} used {{move}}!', { name: attackerName, move: moveName })]);
      await wait(600);
      setAttackAnim(null);
      setLogs(prev => [...prev, t("But nothing happened...")]);
      await wait(1000);

      // Evolution check: 5% chance
      if (Math.random() <= 0.05) {
        setLogs(prev => [...prev, t('What? {{name}} is evolving!', { name: attackerName })]);
        await wait(1500);
        
        setFlashColor('#ffffff');
        await wait(500);
        
        try {
          const gyaradosRes = await fetch('https://pokeapi.co/api/v2/pokemon/gyarados');
          const newGyarados = await gyaradosRes.json();
          const gyaradosSpeciesRes = await fetch('https://pokeapi.co/api/v2/pokemon-species/gyarados');
          const newGyaradosSpecies = await gyaradosSpeciesRes.json();
          
          const isShiny = Math.random() <= 0.1;
          if (isShiny) {
             newGyarados.sprites.front_default = newGyarados.sprites.front_shiny;
          }
          
          const evolvedName = getLocalizedName(newGyaradosSpecies, 'gyarados');
          
          const newMoves = await getFixedMovesDetailsByNames(['dragon-dance', 'waterfall', 'ice-fang', 'earthquake']);
          
          if (isPlayer1) {
             setPlayerPokemon(newGyarados);
             setPlayerSpecies(newGyaradosSpecies);
             setPlayerMoves(newMoves);
             const currentPHp = newGyarados.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 95;
             setPlayerHp(currentPHp * 3);
          } else {
             setOpponentPokemon(newGyarados);
             setOpponentSpecies(newGyaradosSpecies);
             setOpponentMoves(newMoves);
             const currentOHp = newGyarados.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 95;
             setOppHp(currentOHp * 3);
          }
          
          setFlashColor(null);
          setLogs(prev => [...prev, t('Congratulations! {{name}} evolved into {{evolvedName}}!', { name: attackerName, evolvedName })]);
          await wait(1500);
        } catch (error) {
          console.error("Evolution failed:", error);
          setFlashColor(null);
        }
      }

      setCurrentTurn(isPlayer1 ? 'player2' : 'player1');
      setIsProcessing(false);
      return;
    }

    if (move.name === 'dragon-dance') {
      setAttackAnim(isPlayer1 ? 'p1' : 'p2');
      setFlashColor(typeThemes[move.type.name]?.neon || '#fff');
      await wait(400);
      setLogs(prev => [...prev, t('{{name}} used {{move}}!', { name: attackerName, move: moveName })]);
      await wait(600);
      setFlashColor(null);
      setAttackAnim(null);
      setLogs(prev => [...prev, t("{{name}}'s Attack and Speed rose!", { name: attackerName })]);
      await wait(1000);
      setCurrentTurn(isPlayer1 ? 'player2' : 'player1');
      setIsProcessing(false);
      return;
    }

    // 공격 타입에 따른 모션 결정
    const physicalTypes = ['normal', 'fighting', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'flying'];
    const currentMotion = physicalTypes.includes(move.type.name) ? 'physical' : 'special';
    setMotionType(currentMotion);

    // 1. 공격 돌진 시작
    setAttackAnim(isPlayer1 ? 'p1' : 'p2');
    setFlashColor(typeThemes[move.type.name]?.neon || '#fff');
    await wait(200);

    // 2. 타격 순간 (플래시 + 진동 + 데미지 팝업)
    const power = move.power || 50;
    const isStab = attacker.types.some(t => t.type.name === move.type.name);
    const multiplier = getMultiplier(move.type.name, defender.types.map(t => t.type.name));
    setLastMultiplier(multiplier);
    const damage = calculateDamage(power, attackerAtk, defenderDef, multiplier, isStab);

    setHitFlash(isPlayer1 ? 'p2' : 'p1');
    setDamageEffect(isPlayer1 ? 'p2' : 'p1');
    setHitDamage({ value: damage, type: isPlayer1 ? 'p2' : 'p1' });

    await wait(100);
    setFlashColor(null);
    setHitFlash(null); // 플래시는 짧게 종료

    await wait(100);
    setAttackAnim(null); // 공격자 복귀

    // 데미지 숫자 제거 타이밍
    setTimeout(() => setHitDamage(null), 800);

    setLogs(prev => [...prev, t('{{name}} used {{move}}!', { name: attackerName, move: moveName })]);

    await wait(800);

    // 독 걸릴 확률 
    if (move.type.name === 'poison' && multiplier > 0.6) {
      if (isPlayer1 && !oppStatus && !opponentPokemon?.types.some(t => t.type.name === 'poison' || t.type.name === 'steel')) {
        setOppStatus('poison');
        setLogs(prev => [...prev, t('{{name}} was poisoned!', { name: getLocalizedName(opponentSpecies, opponentPokemon?.name || '') })]);
        await wait(600);
      } else if (!isPlayer1 && !playerStatus && !playerPokemon?.types.some(t => t.type.name === 'poison' || t.type.name === 'steel')) {
        setPlayerStatus('poison');
        setLogs(prev => [...prev, t('{{name}} was poisoned!', { name: getLocalizedName(playerSpecies, playerPokemon?.name || '') })]);
        await wait(600);
      }
    }


    if (isPlayer1) {
      const newHp = Math.max(0, oppHp - damage);
      setOppHp(newHp);
      if (multiplier > 1) setLogs(prev => [...prev, t("It's super effective!")]);
      else if (multiplier < 1 && multiplier > 0) setLogs(prev => [...prev, t("It's not very effective...")]);
      else if (multiplier === 0) setLogs(prev => [...prev, t("It had no effect!")]);
      if (multiplier !== 1) await wait(600);
      setLogs(prev => [...prev, t('Dealt {{damage}} damage!', { damage })]);
      if (newHp <= 0) {
        setFainting('p2');
        await wait(1500);
        const winName = getLocalizedName(playerSpecies, playerPokemon!.name);
        setWinner({ player: '1 PLAYER', pokemon: winName });
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
        setFainting('p1');
        await wait(1500);
        const winName = getLocalizedName(opponentSpecies, opponentPokemon!.name);
        setWinner({ player: '2 PLAYER', pokemon: winName });
        setLogs(prev => [...prev, t('{{name}} fainted! Player 2 wins!', { name: getLocalizedName(defenderSpecies, defender.name) })]);
        setBattleOver(true); setIsProcessing(false); setDamageEffect(null); return;
      }
    }

    await wait(600);
    setDamageEffect(null);
    await wait(400);

    const maxPlayerHp = (getStatValue(playerPokemon, 'hp') || 50) * 3;
    const maxOppHp = (getStatValue(opponentPokemon, 'hp') || 50) * 3;
    const attackerStatus = isPlayer1 ? playerStatus : oppStatus;
    if (attackerStatus === 'poison') {
      const dotDamage = Math.floor((isPlayer1 ? maxPlayerHp : maxOppHp) / 8);
      if (isPlayer1) {
        const nextHp = Math.max(0, playerHp - dotDamage);
        setPlayerHp(nextHp);
        setLogs(prev => [...prev, t('{{name}} is hurt by poison!', { name: getLocalizedName(playerSpecies, playerPokemon?.name || '') })]);
        if (nextHp <= 0) {
          setFainting('p1');
          await wait(1500);
          const winName = getLocalizedName(opponentSpecies, opponentPokemon!.name);
          setWinner({ player: '2PLAYER', pokemon: winName });
          setLogs(prev => [...prev, t('{{name}} fainted! Player 2 wins!', { name: getLocalizedName(playerSpecies, playerPokemon?.name || '') })]);
          setBattleOver(true); setIsProcessing(false); return;
        }
      } else {
        const nextHp = Math.max(0, oppHp - dotDamage);
        setOppHp(nextHp);
        setLogs(prev => [...prev, t('{{name}} is hurt by poison!', { name: getLocalizedName(opponentSpecies, opponentPokemon?.name || '') })]);
        if (nextHp <= 0) {
          setFainting('p2');
          await wait(1500);
          const winName = getLocalizedName(playerSpecies, playerPokemon!.name);
          setWinner({ player: '1PLAYER', pokemon: winName });
          setLogs(prev => [...prev, t('Opponent {{name}} fainted! Player 1 wins!', { name: getLocalizedName(opponentSpecies, opponentPokemon?.name || '') })]);
          setBattleOver(true); setIsProcessing(false); return;
        }
      }

      await wait(800);
    }

    setCurrentTurn(isPlayer1 ? 'player2' : 'player1');
    setIsProcessing(false);
  };

  if (!playerPokemon || !opponentPokemon) return null;

  const maxPlayerHp = (getStatValue(playerPokemon, 'hp') || 50) * 3;
  const maxOppHp = (getStatValue(opponentPokemon, 'hp') || 50) * 3;

  const activeMoves = currentTurn === 'player1' ? playerMoves : opponentMoves;
  const activePlayerName = currentTurn === 'player1' ? 'PLAYER 1' : 'PLAYER 2';

  return (
    <div className="h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col selection:bg-blue-500">

      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} className="absolute inset-0"></div>
      </div>

      <header className="z-50 bg-[#1a1a1a]/80 backdrop-blur-xl border-b-[4px] sm:border-b-[6px] border-black px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-6">
          <div onClick={() => router.back()} className="cursor-pointer group flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 border-2 sm:border-4 border-black rounded-lg sm:rounded-xl shadow-[3px_3px_0_0_#000] group-hover:translate-x-1 transition-all flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
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

      <main className="flex-1 flex flex-col p-2 sm:p-4 lg:p-6 gap-3 sm:gap-6 relative overflow-hidden">

        <div className="flex-1 relative bg-black/40 border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-[#0a0a1a] overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1e3a8a 0%, transparent 80%)' }}></div>
            <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-[#0f172a] to-transparent"></div>
            <div className="absolute inset-0 w-full h-full animate-scan pointer-events-none opacity-5 bg-gradient-to-b from-blue-400 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 w-full h-1/2 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent, rgba(255,255,255,0.1) 90%), linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 90%)', backgroundSize: '100px 40px', transform: 'perspective(500px) rotateX(60deg)' }}></div>
          </div>

          {flashColor && (
            <div className="absolute inset-0 z-50 pointer-events-none animate-in fade-in out-fade-out duration-300" style={{ backgroundColor: `${flashColor}22` }}>
              <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 100px ${flashColor}55` }}></div>
            </div>
          )}

          <div className={`absolute top-[5%] right-[5%] sm:top-[8%] sm:right-[8%] flex flex-col items-end gap-2 sm:gap-3 z-10 animate-in slide-in-from-right duration-700 ${damageEffect === 'p2' && lastMultiplier > 1 ? 'animate-screen-shake' : ''}`}>
            <div className="bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl min-w-[200px] sm:min-w-[300px] relative overflow-hidden z-20">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30"></div>
              <div className="flex justify-between items-end mb-1 sm:mb-2 border-b border-white/5 pb-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-mono font-black text-xs sm:text-lg uppercase text-white tracking-tighter truncate max-w-[120px]">{getLocalizedName(opponentSpecies, opponentPokemon.name)}</span>
                  {oppStatus === 'poison' && <span className="bg-purple-600 text-white text-[6px] sm:text-[8px] font-black px-1 rounded border border-purple-400 animate-pulse">PSN</span>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    {opponentPokemon.types.map(t => (
                      <span key={t.type.name} className="px-1.5 py-0.5 text-[6px] sm:text-[8px] font-black text-white rounded border border-white/10 uppercase" style={{ backgroundColor: `${typeThemes[t.type.name]?.main || '#555'}88` }}>
                        {t.type.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full bg-black/50 h-2 sm:h-3 rounded-full overflow-hidden flex items-center p-[1px] sm:p-[2px] border border-white/10">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getHpColor(getHpPercentage(oppHp, maxOppHp))}`} style={{ width: `${getHpPercentage(oppHp, maxOppHp)}%` }}></div>
              </div>
              <div className="flex justify-end mt-1 font-mono text-[7px] sm:text-[9px] font-black text-white/60">
                <span className="tracking-widest">{Math.max(0, oppHp)} / {maxOppHp}</span>
              </div>
            </div>
            <div className={`relative z-10 transition-all duration-300
                ${damageEffect === 'p2' ? 'animate-shake' : ''} 
                ${attackAnim === 'p2' && motionType === 'physical' ? 'animate-lunge-p2' : ''}
                ${attackAnim === 'p2' && motionType === 'special' ? 'animate-vibrate scale-105' : ''}`}>

              {/* 데미지 숫자 팝업 (위치 및 크기 조정) */}
              {hitDamage?.type === 'p2' && (
                <div className="absolute -top-12 left-3/4 -translate-x-1/2 z-50 pointer-events-none animate-damage-popup">
                  <span className="text-xl sm:text-3xl font-mono font-black text-red-500 [text-shadow:_0_2px_8px_rgba(0,0,0,0.8),_0_0_15px_#ef4444]">-{hitDamage.value}</span>
                </div>
              )}

              {/* 액티브 배틀 패드 (원형) */}
              <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-60 h-8 sm:h-16 transition-all duration-700 ${currentTurn === 'player2' ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
                <div className="absolute inset-0 bg-blue-500/20 rounded-[50%] blur-xl animate-pulse"></div>
                <div className="absolute inset-[10%] border-2 sm:border-4 border-blue-500/40 rounded-[50%] shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
                <div className="absolute inset-0 border border-white/20 rounded-[50%]"></div>
              </div>

              <img
                src={opponentPokemon.sprites.front_default}
                className={`w-24 h-24 sm:w-48 sm:h-48 relative z-10 transition-all duration-500 
                    ${currentTurn === 'player2' ? 'scale-110' : 'scale-100 opacity-60 grayscale-[30%]'} 
                    ${hitFlash === 'p2' ? 'brightness-[10] contrast-[2] transition-none' : ''}
                    ${fainting === 'p2' ? 'animate-faint pointer-events-none' : ''}`}
                style={{ imageRendering: 'pixelated' }}
              />

              {/* 액티브 인디케이터 */}
              {currentTurn === 'player2' && !isProcessing && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rotate-45 shadow-[0_0_10px_#3b82f6]"></div>
                </div>
              )}
            </div>
          </div>

          <div className={`absolute bottom-[5%] left-[5%] sm:bottom-[8%] sm:left-[8%] flex flex-col items-start gap-2 sm:gap-3 z-10 animate-in slide-in-from-left duration-700 ${damageEffect === 'p1' && lastMultiplier > 1 ? 'animate-screen-shake' : ''}`}>
            <div className={`relative z-10 transition-all duration-300
                ${damageEffect === 'p1' ? 'animate-shake' : ''} 
                ${attackAnim === 'p1' && motionType === 'physical' ? 'animate-lunge-p1' : ''}
                ${attackAnim === 'p1' && motionType === 'special' ? 'animate-vibrate scale-105' : ''}`}>

              {/* 데미지 숫자 팝업 (위치 및 크기 조정) */}
              {hitDamage?.type === 'p1' && (
                <div className="absolute -top-12 left-1/4 -translate-x-1/2 z-50 pointer-events-none animate-damage-popup">
                  <span className="text-xl sm:text-3xl font-mono font-black text-red-500 [text-shadow:_0_2px_8px_rgba(0,0,0,0.8),_0_0_15px_#ef4444]">-{hitDamage.value}</span>
                </div>
              )}

              {/* 액티브 배틀 패드 (원형) */}
              <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-64 h-10 sm:h-20 transition-all duration-700 ${currentTurn === 'player1' ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
                <div className="absolute inset-0 bg-blue-400/20 rounded-[50%] blur-xl animate-pulse"></div>
                <div className="absolute inset-[10%] border-2 sm:border-4 border-blue-400/40 rounded-[50%] shadow-[0_0_20px_rgba(96,165,250,0.6)]"></div>
                <div className="absolute inset-0 border border-white/20 rounded-[50%]"></div>
              </div>

              <img
                src={playerPokemon.sprites.front_default}
                className={`w-28 h-28 sm:w-52 sm:h-52 relative z-10 transition-all duration-500 scale-x-[-1] 
                    ${currentTurn === 'player1' ? 'scale-x-[-1.1] scale-y-[1.1]' : 'scale-x-[-1] opacity-60 grayscale-[30%]'} 
                    ${hitFlash === 'p1' ? 'brightness-[10] contrast-[2] transition-none' : ''}
                    ${fainting === 'p1' ? 'animate-faint pointer-events-none' : ''}`}
                style={{ imageRendering: 'pixelated' }}
              />

              {/* 액티브 인디케이터 */}
              {currentTurn === 'player1' && !isProcessing && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rotate-45 shadow-[0_0_12px_#60a5fa]"></div>
                </div>
              )}
            </div>
            <div className="bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl min-w-[200px] sm:min-w-[300px] relative overflow-hidden z-20">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/30"></div>
              <div className="flex justify-between items-end mb-1 sm:mb-2 border-b border-white/5 pb-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-mono font-black text-xs sm:text-lg uppercase text-white tracking-tighter truncate max-w-[120px]">{getLocalizedName(playerSpecies, playerPokemon.name)}</span>
                  {playerStatus === 'poison' && <span className="bg-purple-600 text-white text-[7px] sm:text-[10px] font-black px-1.5 rounded border border-purple-400 animate-pulse">PSN</span>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    {playerPokemon.types.map(t => (
                      <span key={t.type.name} className="px-1.5 py-0.5 text-[6px] sm:text-[8px] font-black text-white rounded border border-white/10 uppercase" style={{ backgroundColor: `${typeThemes[t.type.name]?.main || '#555'}88` }}>
                        {t.type.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full bg-black/50 h-3 sm:h-4 rounded-full overflow-hidden flex items-center p-[1px] sm:p-[2px] border border-white/10">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getHpColor(getHpPercentage(playerHp, maxPlayerHp))}`} style={{ width: `${getHpPercentage(playerHp, maxPlayerHp)}%` }}></div>
              </div>
              <div className="flex justify-end mt-1 sm:mt-2 font-mono text-[8px] sm:text-[10px] font-black text-white/60">
                <span className="tracking-[0.1em] sm:tracking-[0.2em]">{Math.max(0, playerHp)} / {maxPlayerHp}</span>
              </div>
            </div>
          </div>

          {!battleOver && !loading && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-50 pointer-events-none px-4">
              <div className={`px-4 sm:px-12 py-1.5 sm:py-3 bg-black/60 border-y-2 sm:border-y-4 border-blue-500/30 backdrop-blur-xl transition-all duration-500 transform ${isProcessing ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                <p className="font-mono text-white text-[10px] sm:text-2xl font-black tracking-[0.1em] sm:tracking-[0.3em] uppercase animate-pulse text-center">{activePlayerName} TURN</p>
              </div>
            </div>
          )}

          {battleOver && winner && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-700">
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-700">

                {/* 배경 후광 효과 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative flex flex-col items-center text-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-yellow-500"></div>
                    <span className="text-yellow-500 font-mono font-black text-xs sm:text-sm uppercase tracking-[0.6em] animate-pulse">Battle Analysis Finalized</span>
                    <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-yellow-500"></div>
                  </div>

                  <h2 className="text-5xl sm:text-7xl font-mono font-black text-white uppercase tracking-tighter leading-tight mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    {winner.player} <span className="text-yellow-500">VICTORY</span>
                  </h2>

                  <div className="relative px-10 py-4 bg-white/5 border-y border-white/10 backdrop-blur-md overflow-hidden group min-w-[280px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <p className="text-xl sm:text-2xl font-mono font-black text-white/80 uppercase tracking-[0.3em] leading-none">
                      {winner.pokemon}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-yellow-500 rotate-45 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 제어 센터 (모바일/데스크탑 반응형 슬라이딩) */}
        <div className="h-44 sm:h-56 shrink-0 relative w-full overflow-hidden">

          {/* 커맨드 콘솔 */}
          <div
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out z-20 border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 flex flex-col shadow-2xl ${currentTurn === 'player1'
              ? 'left-0 w-[calc(65%-0.5rem)] sm:w-[calc(65%-0.75rem)] bg-blue-900/20 shadow-[0_0_40px_rgba(59,130,246,0.2)]'
              : 'left-[calc(35%+0.5rem)] sm:left-[calc(35%+0.75rem)] w-[calc(65%-0.5rem)] sm:w-[calc(65%-0.75rem)] bg-red-900/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]'
              }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 sm:px-4 sm:py-1 bg-black border-2 border-white/10 rounded-full z-30 flex items-center gap-2">
              <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse ${currentTurn === 'player1' ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
              <span className={`text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] ${currentTurn === 'player1' ? 'text-blue-400' : 'text-red-500'}`}>
                {currentTurn === 'player1' ? 'PLAYER_01' : 'PLAYER_02'}
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
                <button onClick={() => { resetBattle(); router.back(); }} className="px-6 sm:px-10 py-2 sm:py-3 bg-blue-600 text-white border-2 sm:border-4 border-black rounded-lg sm:rounded-xl font-mono font-black uppercase text-[10px] sm:text-sm shadow-[4px_4px_0_0_#000] hover:bg-blue-500 active:translate-y-0.5 active:shadow-none transition-all outline-none">
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
                    className={`group relative h-full p-3 sm:p-5 border-l-[8px] sm:border-l-[12px] border-black rounded-r-2xl sm:rounded-r-[3rem] transition-all duration-500 flex flex-col justify-center overflow-hidden disabled:opacity-20 hover:translate-x-3 active:translate-x-1 outline-none`}
                    style={{
                      backgroundColor: `${typeThemes[move.type.name]?.main || '#555'}ee`,
                      boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), inset -10px 0 20px rgba(0,0,0,0.2)`,
                      borderLeftColor: typeThemes[move.type.name]?.neon || '#fff'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10 flex items-center justify-between w-full px-1">
                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: typeThemes[move.type.name]?.neon }}></div>
                          <span className="font-mono text-[7px] sm:text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">{move.type.name}</span>
                        </div>
                        <p className="font-mono font-black text-sm sm:text-2xl text-white uppercase tracking-tighter [text-shadow:_0_2px_4px_rgb(0_0_0_/_80%)] group-hover:scale-110 transition-transform origin-left">{getLocalizedMoveName(move)}</p>
                      </div>

                      <div className="flex gap-2 sm:gap-5 items-center">
                        <div className="flex flex-col items-end">
                          <span className="text-[6px] sm:text-[8px] text-white/30 uppercase font-black tracking-widest">Power</span>
                          <span className="text-[10px] sm:text-lg font-mono font-black text-white">{move.power || '--'}</span>
                        </div>
                        <div className="w-[1px] h-6 sm:h-10 bg-white/10"></div>
                        <div className="flex flex-col items-end">
                          <span className="text-[6px] sm:text-[8px] text-white/30 uppercase font-black tracking-widest">Accuracy</span>
                          <span className="text-[10px] sm:text-lg font-mono font-black text-white">{move.accuracy || '--'}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 배틀 데이터 로그 (반응형 사이징) */}
          <div
            ref={logBoxRef}
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out z-10 bg-[#0a0a0a] border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 overflow-y-auto shadow-inner custom-scrollbar ${currentTurn === 'player1'
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
        @keyframes vibrate {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-12px); }
          40% { transform: translateX(12px); }
          60% { transform: translateX(-12px); }
          80% { transform: translateX(12px); }
        }
         @keyframes damage-popup {
           0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
           20% { transform: translate(-50%, -30px) scale(1.1); opacity: 1; }
           70% { transform: translate(-50%, -50px) scale(1); opacity: 1; }
           100% { transform: translate(-50%, -70px) scale(0.8); opacity: 0; }
         }
         @keyframes screen-shake {
           0%, 100% { transform: translate(0, 0); }
           10%, 30%, 50%, 70%, 90% { transform: translate(-10px, -10px); }
           20%, 40%, 60%, 80% { transform: translate(10px, 10px); }
         }
         @keyframes lunge-p1 {
           0% { transform: translateX(0) scale(1); }
           20% { transform: translateX(-30px) scale(0.95); }
           45% { transform: translateX(100px) scale(1.1); }
           100% { transform: translateX(0) scale(1); }
         }
         @keyframes lunge-p2 {
           0% { transform: translateX(0) scale(1); }
           20% { transform: translateX(30px) scale(0.95); }
           45% { transform: translateX(-100px) scale(1.1); }
           100% { transform: translateX(0) scale(1); }
         }
         @keyframes recoil {
           0% { transform: translateX(0); }
           20% { transform: translateX(20px); }
           100% { transform: translateX(0); }
         }
         .animate-lunge-p1 { animation: lunge-p1 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
         .animate-lunge-p2 { animation: lunge-p2 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
         .animate-recoil { animation: recoil 0.3s ease-out; }
         .animate-damage-popup { animation: damage-popup 1s ease-out forwards; }
         .animate-screen-shake { animation: screen-shake 0.4s ease-in-out; }
         .animate-vibrate { animation: vibrate 0.3s linear; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        @keyframes faint {
          0% { transform: translateY(0) scale(1) skew(0); filter: brightness(1) contrast(1); opacity: 1; }
          15% { transform: translateY(10px) skew(10deg); filter: brightness(2) contrast(2); opacity: 0.8; }
          30% { transform: translateY(20px) skew(-10deg); filter: brightness(0.5) contrast(3); opacity: 0.9; }
          45% { transform: translateY(40px) scaleY(0.6); filter: brightness(4) contrast(0.5); opacity: 0.6; }
          60% { transform: translateY(70px) scaleY(0.3) scaleX(1.5); filter: brightness(10); opacity: 0.4; }
          100% { transform: translateY(150px) scale(0); filter: brightness(20); opacity: 0; }
        }
        .animate-faint { animation: faint 1.2s cubic-bezier(0.4, 0, 1, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
