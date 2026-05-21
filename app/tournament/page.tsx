"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBattle, TournamentMatch } from '@/src/context/BattleContext';
import { getRandomMoves } from '@/src/services/pokeapi';

export default function TournamentPage() {
  const router = useRouter();
  const { 
    playerTeam, playerTeamMoves, battleMode,
    tournamentMatches, setTournamentMatches,
    currentMatchId, setCurrentMatchId,
    setPlayerTeam, setPlayerTeamMoves, setOpponentTeam, setOpponentTeamMoves,
    setPlayerPokemon, setOpponentPokemon, setPlayerMoves, setOpponentMoves // For 1v1 compat
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
    // Generate 7 AI opponents
    const opponentPromises = Array.from({ length: 7 }).map(async (_, i) => {
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
    
    const participants = [playerProfile, ...opponents];
    
    // Quarterfinals
    const matches: TournamentMatch[] = [
      { id: 1, player1: participants[0], player2: participants[1], winner: null, nextMatchId: 5 },
      { id: 2, player1: participants[2], player2: participants[3], winner: null, nextMatchId: 5 },
      { id: 3, player1: participants[4], player2: participants[5], winner: null, nextMatchId: 6 },
      { id: 4, player1: participants[6], player2: participants[7], winner: null, nextMatchId: 6 },
      // Semifinals
      { id: 5, player1: null, player2: null, winner: null, nextMatchId: 7 },
      { id: 6, player1: null, player2: null, winner: null, nextMatchId: 7 },
      // Final
      { id: 7, player1: null, player2: null, winner: null, nextMatchId: null },
    ];
    
    setTournamentMatches(matches as any);
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
      
      router.push('/battle');
    }
  };
  
  if (loading) return <div className="h-screen bg-[#050505] text-blue-400 flex flex-col items-center justify-center font-mono animate-pulse tracking-widest"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>GENERATING TOURNAMENT BRACKET...</div>;
  
  const nextPlayerMatch = tournamentMatches.find(m => m.winner === null && (m.player1?.name === 'Player' || m.player2?.name === 'Player'));
  const isChampion = tournamentMatches.find(m => m.id === 7)?.winner !== null && (tournamentMatches.find(m => m.id === 7)?.winner === 1 ? tournamentMatches.find(m => m.id === 7)?.player1?.name === 'Player' : tournamentMatches.find(m => m.id === 7)?.player2?.name === 'Player');
  const isEliminated = !isChampion && tournamentMatches.some(m => m.winner !== null && (
    (m.player1?.name === 'Player' && m.winner === 2) || 
    (m.player2?.name === 'Player' && m.winner === 1)
  ));

  return (
    <div className="h-screen bg-[#050505] text-white overflow-hidden flex flex-col p-4 sm:p-8 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="relative z-10 flex flex-col h-full">
        <h1 className="text-3xl sm:text-5xl font-black font-mono text-center text-yellow-400 mb-6 sm:mb-12 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] uppercase tracking-widest">
          Champion Tournament
        </h1>
        
        <div className="flex-1 flex justify-center items-stretch gap-4 sm:gap-16 w-full max-w-6xl mx-auto">
          {/* Quarterfinals */}
          <div className="flex flex-col justify-between w-1/3 gap-4">
            {tournamentMatches.slice(0, 4).map(m => <MatchBox key={m.id} match={m} />)}
          </div>
          
          {/* Semifinals */}
          <div className="flex flex-col justify-around w-1/3 py-16 sm:py-24">
            {tournamentMatches.slice(4, 6).map(m => <MatchBox key={m.id} match={m} />)}
          </div>
          
          {/* Final */}
          <div className="flex flex-col justify-center w-1/3">
            {tournamentMatches.slice(6, 7).map(m => <MatchBox key={m.id} match={m} isFinal />)}
          </div>
        </div>
        
        <div className="mt-8 flex justify-center h-20 items-center">
          {isChampion ? (
             <div className="flex flex-col items-center animate-in zoom-in duration-700">
               <h2 className="text-5xl text-yellow-400 font-black animate-pulse drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">YOU ARE THE CHAMPION!</h2>
               <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-mono text-sm transition-all">Back to Menu</button>
             </div>
          ) : isEliminated ? (
             <div className="flex flex-col items-center animate-in fade-in duration-700">
               <h2 className="text-3xl text-red-500 font-black">ELIMINATED</h2>
               <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-mono text-sm transition-all">Back to Menu</button>
             </div>
          ) : nextPlayerMatch?.player2 ? (
            <button onClick={startNextMatch} className="group relative px-10 py-4 bg-red-600 border-[4px] border-black rounded-[1.5rem] shadow-[0_10px_0_0_#991b1b,0_0_40px_rgba(220,38,38,0.5)] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#991b1b,0_0_60px_rgba(220,38,38,0.8)] active:translate-y-2 active:shadow-[0_0_0_0_#991b1b] transition-all">
              <span className="text-white font-black font-mono text-xl sm:text-2xl uppercase tracking-widest group-hover:scale-105 inline-block transition-transform">NEXT BATTLE</span>
            </button>
          ) : (
            <div className="text-xl font-mono text-blue-400/70 animate-pulse tracking-widest">AWAITING OPPONENT...</div>
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
