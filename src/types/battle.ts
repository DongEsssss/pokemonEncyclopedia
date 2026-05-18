import { MoveDetails, Pokemon, PokemonSpecies } from "./pokemon";

export type Turn = 'player1' | 'player2';
export type MajorStatus = 'PAR' | 'BRN' | 'SLP' | 'PSN' | 'TOX' | 'FRZ' | null;

export interface VolatileStatus {
  confusionTurns: number;
  flinch: boolean;
  infatuation: boolean;
  curse: boolean;
  sleepTurns: number;
  toxTurns: number;
}

export interface StatStages {
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface BattleState {
  logs: string[];
  battleOver: boolean;
  playerHp: number;
  oppHp: number;
  playerMoves: MoveDetails[];
  opponentMoves: MoveDetails[];
  playerSpecies: PokemonSpecies | null;
  opponentSpecies: PokemonSpecies | null;
  loading: boolean;
  currentTurn: Turn;
  isProcessing: boolean;
  damageEffect: 'p1' | 'p2' | null;
  playerStatus: MajorStatus;
  opponentStatus: MajorStatus;
  playerVolatile: VolatileStatus;
  opponentVolatile: VolatileStatus;
}
