"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { TournamentMatch, TournamentPlayer } from '@/src/context/BattleContext';
import { useBattle } from '@/src/context/BattleContext';
import { getPokemon, getRandomMoves } from '@/src/services/pokeapi';

async function generateBracket(
  tournamentSize: number,
  battleMode: '1v1' | '2v2',
  playerTeam: TournamentPlayer['pokemon'],
  playerTeamMoves: TournamentPlayer['moves'],
  signal: AbortSignal,
): Promise<TournamentMatch[]> {
  const opponents: TournamentPlayer[] = [];
  const teamSize = battleMode === '2v2' ? 2 : 1;
  const batchSize = 4;
  for (let offset = 0; offset < tournamentSize - 1; offset += batchSize) {
    signal.throwIfAborted();
    const count = Math.min(batchSize, tournamentSize - 1 - offset);
    const batch = await Promise.all(Array.from({ length: count }, async (_, index) => {
      const pokemon: TournamentPlayer['pokemon'] = [];
      const moves: TournamentPlayer['moves'] = [];
      for (let slot = 0; slot < teamSize; slot++) {
        const member = await getPokemon(Math.floor(Math.random() * 898) + 1, signal);
        pokemon.push(member);
        moves.push(await getRandomMoves(member.moves, 4, signal));
      }
      return { name: `Trainer ${offset + index + 1}`, pokemon, moves };
    }));
    opponents.push(...batch);
  }
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
    matches[i].player1 = participants[i * 2];
    matches[i].player2 = participants[i * 2 + 1];
  }

  return matches;
}

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
  
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const hasBracket = tournamentMatches.length > 0;

  useEffect(() => {
    if (playerTeam.length === 0) {
      router.push('/');
      return;
    }
    if (hasBracket) return;

    const request = new AbortController();
    generateBracket(tournamentSize, battleMode, playerTeam, playerTeamMoves, request.signal)
      .then((matches) => {
        if (!request.signal.aborted) setTournamentMatches(matches);
      })
      .catch(() => {
        if (request.signal.aborted) return;
        request.abort();
        setLoadFailed(true);
      });
    return () => request.abort();
  }, [battleMode, hasBracket, loadAttempt, playerTeam, playerTeamMoves, router, setTournamentMatches, tournamentSize]);

  useEffect(() => {
    if (hasBracket) resolveAIvsAIMatches();
  }, [tournamentMatches]);

  const resolveAIvsAIMatches = () => {
    let updated = false;
    const newMatches = tournamentMatches.map((match) => ({ ...match }));
    
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
  
  if (!hasBracket) {
    return (
      <div className="lab-width lab-tournament-state">
        {loadFailed ? (
          <div role="alert" className="grid justify-items-center gap-4">
            <p>{t('Could not generate the tournament bracket.')}</p>
            <button type="button" className="lab-button lab-button-primary" onClick={() => {
              setLoadFailed(false);
              setLoadAttempt((attempt) => attempt + 1);
            }}>{t('Retry')}</button>
          </div>
        ) : <p role="status">{t('Generating tournament bracket…')}</p>}
      </div>
    );
  }
  
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
    <main className="lab-tournament lab-width">
      <header className="lab-page-heading">
        <h1 className="lab-route-title">{t('Champion Tournament')}</h1>
        <span className="lab-tournament-count">{t('{{count}} participants', { count: tournamentSize })}</span>
      </header>

      <div className="lab-bracket" role="region" aria-label={t('Champion Tournament')} tabIndex={0}>
        <div className="lab-bracket-track">
          {rounds.map((roundMatches, roundIndex) => {
            const isFinal = roundIndex === rounds.length - 1;
            return (
              <section className="lab-bracket-round" key={roundIndex}>
                <h2>{isFinal ? t('Final') : t('Round {{round}}', { round: roundIndex + 1 })}</h2>
                <div>
                  {roundMatches.map((match) => <MatchBox key={match.id} match={match} isFinal={isFinal} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <footer className="lab-tournament-actions">
        {isChampion || isEliminated ? (
          <>
            <h2>{isChampion ? t('우승하셨습니다!') : t('탈락하셨습니다')}</h2>
            <button type="button" onClick={() => router.push('/')} className="lab-button lab-button-outline">{t('메뉴로 돌아가기')}</button>
          </>
        ) : nextPlayerMatch?.player2 ? (
          <button type="button" onClick={startNextMatch} className="lab-button lab-button-primary">
            {t('다음 배틀 시작')} <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button type="button" onClick={resolveAIvsAIMatches} className="lab-button lab-button-primary">{t('AI 매치 진행하기')}</button>
        )}
      </footer>
    </main>
  );
}

function MatchBox({ match, isFinal }: { match: TournamentMatch; isFinal: boolean }) {
  return (
    <div className="lab-bracket-match" data-final={isFinal}>
      <PlayerRow player={match.player1} isWinner={match.winner === 1} />
      <PlayerRow player={match.player2} isWinner={match.winner === 2} />
    </div>
  );
}

function PlayerRow({ player, isWinner }: { player: TournamentPlayer | null; isWinner: boolean }) {
  return (
    <div className="lab-bracket-player" data-winner={isWinner} data-player={player?.name === 'Player'}>
      <span>{player?.name ?? '—'}</span>
      <div>
        {player?.pokemon.map((pokemon, index) => (
          <img key={index} src={pokemon.sprites.front_default} alt={pokemon.name} width={36} height={36} />
        ))}
      </div>
    </div>
  );
}
