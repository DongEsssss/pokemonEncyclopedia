"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBattle } from '@/src/context/BattleContext';

export default function BattlePage() {
  const router = useRouter();
  const { playerPokemon, opponentPokemon, resetBattle } = useBattle();
  const [logs, setLogs] = useState<string[]>([]);
  const [battleOver, setBattleOver] = useState(false);

  useEffect(() => {
    if (!playerPokemon || !opponentPokemon) {
      router.push('/');
      return;
    }

    // Very simple auto battle logic
    let playerHp = playerPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
    let oppHp = opponentPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
    
    const playerAtk = playerPokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 10;
    const oppAtk = opponentPokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 10;
    
    const playerDef = playerPokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 10;
    const oppDef = opponentPokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 10;

    let battleLogs: string[] = [
      `Wild ${opponentPokemon.name} appeared!`,
      `Go, ${playerPokemon.name}!`
    ];
    setLogs([...battleLogs]);

    const runTurn = async () => {
      // Delay for effect
      const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      while (playerHp > 0 && oppHp > 0) {
        await wait(1000);
        // Player attacks
        const damageToOpp = Math.max(1, Math.floor((playerAtk * 1.5) - oppDef));
        oppHp -= damageToOpp;
        battleLogs.push(`${playerPokemon.name} attacks! Dealt ${damageToOpp} damage!`);
        setLogs([...battleLogs]);
        
        if (oppHp <= 0) {
          await wait(1000);
          battleLogs.push(`Opponent ${opponentPokemon.name} fainted! You win!`);
          setLogs([...battleLogs]);
          break;
        }

        await wait(1000);
        // Opponent attacks
        const damageToPlayer = Math.max(1, Math.floor((oppAtk * 1.5) - playerDef));
        playerHp -= damageToPlayer;
        battleLogs.push(`Opponent ${opponentPokemon.name} attacks! Dealt ${damageToPlayer} damage!`);
        setLogs([...battleLogs]);

        if (playerHp <= 0) {
          await wait(1000);
          battleLogs.push(`${playerPokemon.name} fainted! You lose!`);
          setLogs([...battleLogs]);
          break;
        }
      }
      setBattleOver(true);
    };

    runTurn();

  }, [playerPokemon, opponentPokemon, router]);

  if (!playerPokemon || !opponentPokemon) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
        Battle Arena
      </h1>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
        
        {/* Player Pokemon */}
        <div className="w-full md:w-1/3 p-6 bg-blue-50 border-4 border-blue-400 rounded-3xl shadow-xl flex flex-col items-center">
          <h2 className="text-2xl font-bold capitalize text-blue-900 mb-2">{playerPokemon.name}</h2>
          <img 
            src={playerPokemon.sprites.back_default || playerPokemon.sprites.front_default} 
            alt={playerPokemon.name} 
            className="w-40 h-40 scale-x-[-1] drop-shadow-2xl" 
          />
        </div>

        <div className="text-5xl font-black italic text-yellow-500 drop-shadow-md">VS</div>

        {/* Opponent Pokemon */}
        <div className="w-full md:w-1/3 p-6 bg-red-50 border-4 border-red-400 rounded-3xl shadow-xl flex flex-col items-center">
          <h2 className="text-2xl font-bold capitalize text-red-900 mb-2">{opponentPokemon.name}</h2>
          <img 
            src={opponentPokemon.sprites.front_default} 
            alt={opponentPokemon.name} 
            className="w-40 h-40 drop-shadow-2xl" 
          />
        </div>
        
      </div>

      <div className="bg-gray-900 text-white p-6 rounded-xl shadow-inner font-mono overflow-y-auto max-h-64 border-4 border-gray-700">
        {logs.map((log, i) => (
          <p key={i} className="mb-2 text-lg animate-pulse">{log}</p>
        ))}
        {!battleOver && <p className="mb-2 text-lg text-yellow-400">...</p>}
      </div>

      {battleOver && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => { resetBattle(); router.push('/'); }}
            className="px-8 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold text-xl rounded-full hover:shadow-lg transition transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
