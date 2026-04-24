"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Pokemon } from "../services/pokeapi";

interface BattleContextType {
  playerPokemon: Pokemon | null;
  opponentPokemon: Pokemon | null;
  setPlayerPokemon: (p: Pokemon | null) => void;
  setOpponentPokemon: (p: Pokemon | null) => void;
  resetBattle: () => void;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export function BattleProvider({ children }: { children: ReactNode }) {
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<Pokemon | null>(null);

  const resetBattle = () => {
    setPlayerPokemon(null);
    setOpponentPokemon(null);
  };

  return (
    <BattleContext.Provider
      value={{
        playerPokemon,
        opponentPokemon,
        setPlayerPokemon,
        setOpponentPokemon,
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
