"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useBattle, TournamentMatch } from '@/src/context/BattleContext';
import { getRandomMoves } from '@/src/services/pokeapi';

export default function TournamentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { 
    playerTeam, playerTeamMoves, battleMode,
    tournamentMatches, setTournamentMatches,
    currentMatchId, setCurrentMatchId,
    tournamentSize,
    setPlayerTeam, setPlayerTeamMoves, setOpponentTeam, setOpponentTeamMoves,
    setPlayerPokemon, setOpponentPokemon, setPlayerMoves, setOpponentMoves,
    setIsVsAI
  } = useBattle();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerTeam || playerTeam.length === 0) {
      router.push('/');
      return;
    }
    
    if (tournamentMatches.length === 0) {
      generateBracket();
    } else {
      setLoading(false);
      
      // Auto resolve matches that don't involve the player
      resolveAIvsAIMatches();
    }
  }, [tournamentMatches, playerTeam]);

  const generateBracket = async () => {
    // Generate AI opponents based on tournamentSize
    const opponentPromises = Array.from({ length: tournamentSize - 1 }).map(async (_, i) => {
      const team = [];
      const moves = [];
      const numPokemon = battleMode === '2v2' ? 2 : 1;
      
      for (let j = 0; j < numPokemon; j++) {
        const randomId = Math.floor(Math.random() * 898) + 1;
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await res.json();
        team.push(data);
        moves.push(await getRandomMoves(data.moves, 4));
      }
      return { name: `Trainer ${i + 1}`, pokemon: team, moves: moves };
    });
    
    const opponents = await Promise.all(opponentPromises);
    const playerProfile = { name: 'Player', pokemon: playerTeam, moves: playerTeamMoves };
    
    // Randomize player position
    const participants = [...opponents];
    const playerPos = Math.floor(Math.random() * tournamentSize);
    participants.splice(playerPos, 0, playerProfile);
    
    const matches: TournamentMatch[] = [];
    let matchId = 1;
    let roundSize = tournamentSize / 2;
    let roundStartId = 1;
    
    // Create all matches first to establish IDs
    while (roundSize >= 1) {
      for (let i = 0; i < roundSize; i++) {
        matches.push({
          id: matchId,
          player1: null,
          player2: null,
          winner: null,
          nextMatchId: roundSize === 1 ? null : Math.floor((matchId - roundStartId) / 2) + roundStartId + roundSize
        });
        matchId++;
      }
      roundStartId += roundSize;
      roundSize /= 2;
    }
    
    // Assign initial players to the first round
    for (let i = 0; i < tournamentSize / 2; i++) {
      matches[i].player1 = participants[i * 2] as any;
      matches[i].player2 = participants[i * 2 + 1] as any;
    }
    
    setTournamentMatches(matches);
    setLoading(false);
  };
  
  const resolveAIvsAIMatches = () => {
    let updated = false;
    const newMatches = [...tournamentMatches];
    
    newMatches.forEach(match => {
      if (match.winner === null && match.player1 && match.player2) {
        if (match.player1.name !== 'Player' && match.player2.name !== 'Player') {
          // Both AI, auto resolve
          match.winner = Math.random() > 0.5 ? 1 : 2;
          updated = true;
          
          if (match.nextMatchId) {
            const nextMatch = newMatches.find(m => m.id === match.nextMatchId);
            if (nextMatch) {
              const advancingPlayer = match.winner === 1 ? match.player1 : match.player2;
              if (match.id % 2 !== 0) nextMatch.player1 = advancingPlayer;
              else nextMatch.player2 = advancingPlayer;
            }
          }
        }
      }
    });
    
    if (updated) {
      setTournamentMatches(newMatches);
    }
  };

  const startNextMatch = () => {
    const nextMatch = tournamentMatches.find(m => m.winner === null && (m.player1?.name === 'Player' || m.player2?.name === 'Player'));
    if (nextMatch && nextMatch.player1 && nextMatch.player2) {
      setCurrentMatchId(nextMatch.id);
      
      const p1 = nextMatch.player1;
      const p2 = nextMatch.player2;
      
      const isPlayer1 = p1.name === 'Player';
      const playerSide = isPlayer1 ? p1 : p2;
      const opponentSide = isPlayer1 ? p2 : p1;
      
      setPlayerTeam(playerSide.pokemon as any);
      setPlayerTeamMoves(playerSide.moves as any);
      setOpponentTeam(opponentSide.pokemon as any);
      setOpponentTeamMoves(opponentSide.moves as any);
      
      // For compatibility with BattlePage
      setPlayerPokemon((playerSide.pokemon as any)[0]);
      setPlayerMoves((playerSide.moves as any)[0]);
      setOpponentPokemon((opponentSide.pokemon as any)[0]);
      setOpponentMoves((opponentSide.moves as any)[0]);
      
      setIsVsAI(true);
      router.push('/battle');
    }
  };
  
  if (loading) return <div className="h-screen bg-[#050505] text-blue-400 flex flex-col items-center justify-center font-mono animate-pulse tracking-widest"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>GENERATING TOURNAMENT BRACKET...</div>;
  
  const nextPlayerMatch = tournamentMatches.find(m => m.winner === null && (m.player1?.name === 'Player' || m.player2?.name === 'Player'));
  const finalMatchId = tournamentSize - 1;
  const isChampion = tournamentMatches.find(m => m.id === finalMatchId)?.winner !== null && (tournamentMatches.find(m => m.id === finalMatchId)?.winner === 1 ? tournamentMatches.find(m => m.id === finalMatchId)?.player1?.name === 'Player' : tournamentMatches.find(m => m.id === finalMatchId)?.player2?.name === 'Player');
  const isEliminated = !isChampion && tournamentMatches.some(m => m.winner !== null && (
    (m.player1?.name === 'Player' && m.winner === 2) || 
    (m.player2?.name === 'Player' && m.winner === 1)
  ));

  const rounds = [];
  let rSize = tournamentSize / 2;
  let sId = 1;
  while (rSize >= 1) {
    rounds.push(tournamentMatches.slice(sId - 1, sId - 1 + rSize));
    sId += rSize;
    rSize /= 2;
  }

  return (
    <div className="h-screen bg-[#050505] text-white overflow-hidden flex flex-col p-4 sm:p-8 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="relative z-10 flex flex-col h-full">
        <h1 className="shrink-0 text-3xl sm:text-5xl font-black font-mono text-center text-yellow-400 mb-6 sm:mb-8 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] uppercase tracking-widest">
          Champion Tournament
        </h1>
        
        <div className="flex-1 w-full overflow-auto custom-scrollbar border-y border-white/10 shadow-inner bg-black/40 rounded-xl">
          <div className="flex items-stretch min-h-full gap-8 sm:gap-16 p-8 w-max mx-auto">
            {rounds.map((roundMatches, roundIndex) => (
              <div key={roundIndex} className={`flex flex-col justify-around w-[260px] sm:w-[320px] shrink-0 gap-4 ${roundIndex === rounds.length - 1 ? 'items-center' : ''}`}>
                {roundMatches.map(m => <MatchBox key={m.id} match={m} isFinal={roundIndex === rounds.length - 1} />)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 flex justify-center h-20 items-center">
          {isChampion ? (
             <div className="flex flex-col items-center animate-in zoom-in duration-700">
               <h2 className="text-5xl text-yellow-400 font-black animate-pulse drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">{t('우승하셨습니다!')}</h2>
               <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-mono text-sm transition-all">{t('메뉴로 돌아가기')}</button>
             </div>
          ) : isEliminated ? (
             <div className="flex flex-col items-center animate-in fade-in duration-700">
               <h2 className="text-3xl text-red-500 font-black">{t('탈락하셨습니다')}</h2>
               <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-mono text-sm transition-all">{t('메뉴로 돌아가기')}</button>
             </div>
          ) : nextPlayerMatch?.player2 ? (
            <button onClick={startNextMatch} className="group relative px-10 py-4 bg-red-600 border-[4px] border-black rounded-[1.5rem] shadow-[0_10px_0_0_#991b1b,0_0_40px_rgba(220,38,38,0.5)] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#991b1b,0_0_60px_rgba(220,38,38,0.8)] active:translate-y-2 active:shadow-[0_0_0_0_#991b1b] transition-all">
              <span className="text-white font-black font-mono text-xl sm:text-2xl uppercase tracking-widest group-hover:scale-105 inline-block transition-transform">{t('다음 배틀 시작')}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform rounded-[1rem]"></div>
            </button>
          ) : (
            <button onClick={resolveAIvsAIMatches} className="group relative px-8 py-3 bg-blue-600 border-[4px] border-black rounded-[1.5rem] shadow-[0_8px_0_0_#1e3a8a,0_0_30px_rgba(37,99,235,0.4)] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#1e3a8a,0_0_50px_rgba(37,99,235,0.7)] active:translate-y-2 active:shadow-[0_0_0_0_#1e3a8a] transition-all">
              <span className="text-white font-black font-mono text-lg uppercase tracking-widest group-hover:scale-105 inline-block transition-transform">{t('AI 매치 진행하기')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const MatchBox = ({ match, isFinal = false }: { match: any, isFinal?: boolean }) => (
  <div className={`w-full bg-black/60 border-2 rounded-xl p-2 sm:p-3 flex flex-col gap-1 sm:gap-2 transition-all 
    ${match.winner !== null ? 'border-white/10 opacity-50' : 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}
    ${isFinal ? 'scale-110 sm:scale-125 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : ''}`}>
    <PlayerRow player={match.player1} isWinner={match.winner === 1} isPlayer={match.player1?.name === 'Player'} />
    <div className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
    <PlayerRow player={match.player2} isWinner={match.winner === 2} isPlayer={match.player2?.name === 'Player'} />
  </div>
);

const PlayerRow = ({ player, isWinner, isPlayer }: { player: any, isWinner: boolean, isPlayer: boolean }) => (
  <div className={`flex justify-between items-center font-mono text-[10px] sm:text-sm font-black p-1 rounded transition-colors
    ${isWinner ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/80'} 
    ${isPlayer ? 'text-blue-400' : ''}`}>
    <span className="truncate pr-2">{player ? player.name : 'TBD'}</span>
    <div className="flex gap-1">
      {player && player.pokemon && player.pokemon.map((p: any, i: number) => (
        <div key={i} className={`w-6 h-6 sm:w-8 sm:h-8 rounded bg-black/50 flex items-center justify-center ${isPlayer ? 'border border-blue-500/30' : ''}`}>
           <img src={p.sprites.front_default} className="w-8 h-8 sm:w-10 sm:h-10 max-w-none transform scale-125" style={{ imageRendering: 'pixelated' }} />
        </div>
      ))}
    </div>
  </div>
);
