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

export interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    back_default: string;
  };
  stats: PokemonStat[];
  types: PokemonType[];
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

const API_BASE = 'https://pokeapi.co/api/v2';

export async function getRegions(): Promise<Region[]> {
  const res = await fetch(`${API_BASE}/region`);
  if (!res.ok) throw new Error('Failed to fetch regions');
  const data = await res.json();
  return data.results;
}

export async function getPokedexByRegion(regionName: string): Promise<PokedexEntry[]> {
  const regionRes = await fetch(`${API_BASE}/region/${regionName}`);
  if (!regionRes.ok) throw new Error('Failed to fetch region details');
  const regionData = await regionRes.json();
  
  if (!regionData.pokedexes || regionData.pokedexes.length === 0) {
     return [];
  }
  
  const pokedexUrl = regionData.pokedexes[0].url;
  const pokedexRes = await fetch(pokedexUrl);
  if (!pokedexRes.ok) throw new Error('Failed to fetch pokedex details');
  
  const pokedexData = await pokedexRes.json();
  return pokedexData.pokemon_entries;
}

export async function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const res = await fetch(`${API_BASE}/pokemon/${nameOrId}`);
  if (!res.ok) throw new Error('Failed to fetch pokemon details');
  return await res.json();
}
