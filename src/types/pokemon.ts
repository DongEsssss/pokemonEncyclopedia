export interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

export interface PokemonType {
  type: {
    name: string;
  };
}

export interface PokemonMove {
  move: {
    name: string;
    url: string;
  };
}

export interface MoveDetails {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  type: {
    name: string;
  };
  names: {
    language: { name: string };
    name: string;
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
  }[];
  meta?: {
    min_hits?: number | null;
    max_hits?: number | null;
  };
  damage_class?: {
    name: string;
  };
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    back_default: string;
  };
  stats: PokemonStat[];
  types: PokemonType[];
  moves: PokemonMove[];
}

export interface PokedexEntry {
  entry_number: number;
  pokemon_species: {
    name: string;
    url: string;
  };
}

export interface Region {
  name: string;
  url: string;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  names: {
    language: { name: string };
    name: string;
  }[];
}
