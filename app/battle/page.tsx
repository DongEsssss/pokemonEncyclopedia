"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';

export default function BattlePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { playerPokemon, opponentPokemon, resetBattle } = useBattle();
  const [logs, setLogs] = useState<string[]>([]);
  const [battleOver, setBattleOver] = useState(false);
  const [playerHp, setPlayerHp] = useState<number>(0);
  const [oppHp, setOppHp] = useState<number>(0);

  useEffect(() => {
    if (!playerPokemon || !opponentPokemon) {
      router.push('/');
      return;
    }

    // Very simple auto battle logic
    let currentPHp = playerPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
    let currentOHp = opponentPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
    
    setPlayerHp(currentPHp);
    setOppHp(currentOHp);
    
    const playerAtk = playerPokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 10;
    const oppAtk = opponentPokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 10;
    
    const playerDef = playerPokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 10;
    const oppDef = opponentPokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 10;

    let battleLogs: string[] = [
      t('Wild {{name}} appeared!', { name: opponentPokemon.name }),
      t('Go, {{name}}!', { name: playerPokemon.name })
    ];
    setLogs([...battleLogs]);

    const runTurn = async () => {
      // Delay for effect
      const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      while (currentPHp > 0 && currentOHp > 0) {
        await wait(1000);
        // Player attacks
        const damageToOpp = Math.max(1, Math.floor((playerAtk * 1.5) - oppDef));
        currentOHp -= damageToOpp;
        setOppHp(currentOHp);
        battleLogs.push(t('{{name}} attacks! Dealt {{damage}} damage!', { name: playerPokemon.name, damage: damageToOpp }));
        setLogs([...battleLogs]);
        
        if (currentOHp <= 0) {
          await wait(1000);
          battleLogs.push(t('Opponent {{name}} fainted! You win!', { name: opponentPokemon.name }));
          setLogs([...battleLogs]);
          break;
        }

        await wait(1000);
        // Opponent attacks
        const damageToPlayer = Math.max(1, Math.floor((oppAtk * 1.5) - playerDef));
        currentPHp -= damageToPlayer;
        setPlayerHp(currentPHp);
        battleLogs.push(t('Opponent {{name}} attacks! Dealt {{damage}} damage!', { name: opponentPokemon.name, damage: damageToPlayer }));
        setLogs([...battleLogs]);

        if (currentPHp <= 0) {
          await wait(1000);
          battleLogs.push(t('{{name}} fainted! You lose!', { name: playerPokemon.name }));
          setLogs([...battleLogs]);
          break;
        }
      }
      setBattleOver(true);
    };

    runTurn();

  }, [playerPokemon, opponentPokemon, router]);

  if (!playerPokemon || !opponentPokemon) return null;

  const getStat = (pokemon: any, statName: string) => pokemon.stats.find((s: any) => s.stat.name === statName)?.base_stat || 0;

  // HP Bar Logic
  const getHpPercentage = (current: number, max: number) => Math.max(0, Math.min(100, (current / max) * 100));
  const getHpColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const maxPlayerHp = getStat(playerPokemon, 'hp') || 50;
  const maxOppHp = getStat(opponentPokemon, 'hp') || 50;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-4xl md:text-5xl font-black text-center mb-10 text-yellow-400 drop-shadow-[0_4px_4px_rgba(59,76,202,0.8)]" style={{ WebkitTextStroke: '2px #3B4CCA' }}>
        {t('Battle Arena')}
      </h1>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
        
        {/* Player Pokemon */}
        <div className="relative w-full md:w-5/12 p-6 bg-gradient-to-b from-blue-100 to-blue-200 border-8 border-gray-800 rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,0.2)] flex flex-col items-center">
          <h2 className="text-2xl font-black capitalize text-blue-900 mb-2 drop-shadow-sm">{playerPokemon.name}</h2>
          <div className="w-full mb-6 px-4 bg-white p-3 rounded-xl border-4 border-gray-800">
            <div className="flex justify-between text-sm font-black text-gray-800 mb-1">
              <span>HP</span>
              <span>{Math.max(0, playerHp)} / {maxPlayerHp}</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 border-2 border-gray-600 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getHpColor(getHpPercentage(playerHp, maxPlayerHp))}`} 
                style={{ width: `${getHpPercentage(playerHp, maxPlayerHp)}%` }}>
              </div>
            </div>
            <div className="flex justify-between text-[10px] mt-2 text-gray-600 font-bold px-1 uppercase tracking-wider">
              <span>{t('Attack')}: {getStat(playerPokemon, 'attack')}</span>
              <span>{t('Defense')}: {getStat(playerPokemon, 'defense')}</span>
              <span>{t('Speed')}: {getStat(playerPokemon, 'speed')}</span>
            </div>
          </div>
          
          <div className="relative">
            {/* Ellipse shadow */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-black opacity-20 rounded-[50%] blur-sm"></div>
            <img 
              src={playerPokemon.sprites.back_default || playerPokemon.sprites.front_default} 
              alt={playerPokemon.name} 
              className="relative w-48 h-48 scale-x-[-1] drop-shadow-xl" 
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        <div className="text-6xl font-black italic text-yellow-400 drop-shadow-[0_4px_4px_rgba(238,21,21,0.8)]" style={{ WebkitTextStroke: '2px #EE1515' }}>VS</div>

        {/* Opponent Pokemon */}
        <div className="relative w-full md:w-5/12 p-6 bg-gradient-to-b from-red-100 to-red-200 border-8 border-gray-800 rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,0.2)] flex flex-col items-center">
          <h2 className="text-2xl font-black capitalize text-red-900 mb-2 drop-shadow-sm">{opponentPokemon.name}</h2>
          <div className="w-full mb-6 px-4 bg-white p-3 rounded-xl border-4 border-gray-800">
            <div className="flex justify-between text-sm font-black text-gray-800 mb-1">
              <span>HP</span>
              <span>{Math.max(0, oppHp)} / {maxOppHp}</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 border-2 border-gray-600 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getHpColor(getHpPercentage(oppHp, maxOppHp))}`} 
                style={{ width: `${getHpPercentage(oppHp, maxOppHp)}%` }}>
              </div>
            </div>
            <div className="flex justify-between text-[10px] mt-2 text-gray-600 font-bold px-1 uppercase tracking-wider">
              <span>{t('Attack')}: {getStat(opponentPokemon, 'attack')}</span>
              <span>{t('Defense')}: {getStat(opponentPokemon, 'defense')}</span>
              <span>{t('Speed')}: {getStat(opponentPokemon, 'speed')}</span>
            </div>
          </div>
          
          <div className="relative">
            {/* Ellipse shadow */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-black opacity-20 rounded-[50%] blur-sm"></div>
            <img 
              src={opponentPokemon.sprites.front_default} 
              alt={opponentPokemon.name} 
              className="relative w-48 h-48 drop-shadow-xl" 
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
        
      </div>

      {/* Retro Gameboy Log Box */}
      <div className="bg-[#e0f8d0] text-gray-900 p-6 rounded-xl shadow-inner font-mono overflow-y-auto h-64 border-8 border-gray-800 relative z-10" style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
        {logs.map((log, i) => (
          <p key={i} className="mb-4 text-sm md:text-base animate-pulse leading-loose" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>▶ {log}</p>
        ))}
        {!battleOver && <p className="mb-4 text-sm md:text-base text-gray-500 animate-bounce">▶ ...</p>}
      </div>

      {battleOver && (
        <div className="mt-10 flex justify-center">
          <button 
            onClick={() => { resetBattle(); router.push('/'); }}
            className="px-10 py-4 bg-yellow-400 text-gray-900 font-black text-xl rounded-2xl hover:bg-yellow-300 transition transform hover:scale-110 border-4 border-gray-800 shadow-[4px_4px_0_rgba(0,0,0,0.3)] tracking-wider"
          >
            {t('Play Again')}
          </button>
        </div>
      )}
    </div>
  );
}
