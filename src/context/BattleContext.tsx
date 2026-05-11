"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Pokemon, MoveDetails } from "../services/pokeapi";

/**
 * 배틀 관련 상태를 관리하는 컨텍스트의 타입 정의
 */
interface BattleContextType {
  playerPokemon: Pokemon | null; // 플레이어 포켓몬
  opponentPokemon: Pokemon | null; // 상대방 포켓몬
  setPlayerPokemon: (p: Pokemon | null) => void;
  setOpponentPokemon: (p: Pokemon | null) => void;
  playerMoves: MoveDetails[]; // 플레이어 기술 목록
  opponentMoves: MoveDetails[]; // 상대방 기술 목록
  setPlayerMoves: (m: MoveDetails[]) => void;
  setOpponentMoves: (m: MoveDetails[]) => void;
  resetBattle: () => void; // 배틀 상태 초기화
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

/**
 * 배틀 상태를 제공하는 Provider 컴포넌트
 */
export function BattleProvider({ children }: { children: ReactNode }) {
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<Pokemon | null>(null);
  const [playerMoves, setPlayerMoves] = useState<MoveDetails[]>([]);
  const [opponentMoves, setOpponentMoves] = useState<MoveDetails[]>([]);

  // 모든 배틀 데이터를 초기 상태로 되돌립니다.
  const resetBattle = () => {
    setPlayerPokemon(null);
    setOpponentPokemon(null);
    setPlayerMoves([]);
    setOpponentMoves([]);
  };

  return (
    <BattleContext.Provider
      value={{
        playerPokemon,
        opponentPokemon,
        setPlayerPokemon,
        setOpponentPokemon,
        playerMoves,
        opponentMoves,
        setPlayerMoves,
        setOpponentMoves,
        resetBattle,
      }}
    >
      {children}
    </BattleContext.Provider>
  );
}

/**
 * 배틀 컨텍스트를 사용하기 위한 커스텀 훅
 */
export function useBattle() {
  const context = useContext(BattleContext);
  if (context === undefined) {
    throw new Error("useBattle must be used within a BattleProvider");
  }
  return context;
}
