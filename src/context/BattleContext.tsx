"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Pokemon, MoveDetails } from "../types/pokemon";

export interface TournamentPlayer {
  name: string;
  pokemon: Pokemon[];
  moves: MoveDetails[][];
}

export interface TournamentMatch {
  id: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winner: 1 | 2 | null;
  nextMatchId: number | null;
}

interface BattleContextType {
  // Existing 1v1 state
  playerPokemon: Pokemon | null;
  opponentPokemon: Pokemon | null;
  setPlayerPokemon: (p: Pokemon | null) => void;
  setOpponentPokemon: (p: Pokemon | null) => void;
  playerMoves: MoveDetails[];
  opponentMoves: MoveDetails[];
  setPlayerMoves: (m: MoveDetails[]) => void;
  setOpponentMoves: (m: MoveDetails[]) => void;

  // New Modes
  battleMode: '1v1' | '2v2';
  setBattleMode: (mode: '1v1' | '2v2') => void;
  isTournament: boolean;
  setIsTournament: (isTourney: boolean) => void;
  tournamentSize: 4 | 8 | 16 | 32;
  setTournamentSize: (size: 4 | 8 | 16 | 32) => void;
  isVsAI: boolean;
  setIsVsAI: (vsAI: boolean) => void;

  // 2v2 State
  playerTeam: Pokemon[];
  opponentTeam: Pokemon[];
  setPlayerTeam: (t: Pokemon[]) => void;
  setOpponentTeam: (t: Pokemon[]) => void;
  playerTeamMoves: MoveDetails[][];
  opponentTeamMoves: MoveDetails[][];
  setPlayerTeamMoves: (m: MoveDetails[][]) => void;
  setOpponentTeamMoves: (m: MoveDetails[][]) => void;

  // Tournament State
  tournamentMatches: TournamentMatch[];
  setTournamentMatches: (matches: TournamentMatch[]) => void;
  currentMatchId: number | null;
  setCurrentMatchId: (id: number | null) => void;

  resetBattle: () => void;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export function BattleProvider({ children }: { children: ReactNode }) {
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<Pokemon | null>(null);
  const [playerMoves, setPlayerMoves] = useState<MoveDetails[]>([]);
  const [opponentMoves, setOpponentMoves] = useState<MoveDetails[]>([]);

  const [battleMode, setBattleMode] = useState<'1v1' | '2v2'>('1v1');
  const [isTournament, setIsTournament] = useState(false);
  const [tournamentSize, setTournamentSize] = useState<4 | 8 | 16 | 32>(8);
  const [isVsAI, setIsVsAI] = useState(false);

  const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([]);
  const [opponentTeam, setOpponentTeam] = useState<Pokemon[]>([]);
  const [playerTeamMoves, setPlayerTeamMoves] = useState<MoveDetails[][]>([]);
  const [opponentTeamMoves, setOpponentTeamMoves] = useState<MoveDetails[][]>([]);

  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<number | null>(null);

  const resetBattle = () => {
    setPlayerPokemon(null);
    setOpponentPokemon(null);
    setPlayerMoves([]);
    setOpponentMoves([]);
    setPlayerTeam([]);
    setOpponentTeam([]);
    setPlayerTeamMoves([]);
    setOpponentTeamMoves([]);
    // Do not reset mode or tournament structure automatically here, or do it carefully
  };

  return (
    <BattleContext.Provider
      value={{
        playerPokemon, opponentPokemon, setPlayerPokemon, setOpponentPokemon,
        playerMoves, opponentMoves, setPlayerMoves, setOpponentMoves,
        battleMode, setBattleMode,
        isTournament, setIsTournament,
        tournamentSize, setTournamentSize,
        isVsAI, setIsVsAI,
        playerTeam, setPlayerTeam,
        opponentTeam, setOpponentTeam,
        playerTeamMoves, setPlayerTeamMoves,
        opponentTeamMoves, setOpponentTeamMoves,
        tournamentMatches, setTournamentMatches,
        currentMatchId, setCurrentMatchId,
        resetBattle,
      }}
    >
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const context = useContext(BattleContext);
  if (context === undefined) {
    throw new Error("useBattle must be used within a BattleProvider");
  }
  return context;
}
