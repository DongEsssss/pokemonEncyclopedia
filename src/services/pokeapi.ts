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

const API_BASE = 'https://pokeapi.co/api/v2';

export async function getPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
  const res = await fetch(`${API_BASE}/pokemon-species/${nameOrId}`);
  if (!res.ok) throw new Error('Failed to fetch pokemon species details');
  return await res.json();
}

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

export async function getRandomMoves(movesList: PokemonMove[], count: number = 4): Promise<MoveDetails[]> {
  if (!movesList || movesList.length === 0) return [];
  
  const shuffled = [...movesList].sort(() => 0.5 - Math.random());
  const selectedMoves: MoveDetails[] = [];
  
  // Batch fetch to speed things up, since sequential fetching of 10-20 moves can be slow.
  // We'll take first 15 random moves, fetch them in parallel, filter power > 0, then take up to `count`.
  const candidates = shuffled.slice(0, 15);
  const fetchPromises = candidates.map(async (item) => {
    try {
      const res = await fetch(item.move.url);
      if (res.ok) {
        const data: MoveDetails = await res.json();
        return data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);
  for (const data of results) {
    if (data && data.power && data.power > 0) {
      selectedMoves.push(data);
      if (selectedMoves.length >= count) break;
    }
  }
  
  if (selectedMoves.length === 0) {
    selectedMoves.push({
      id: 165,
      name: 'struggle',
      power: 50,
      accuracy: 100,
      type: { name: 'normal' },
      names: [{ language: { name: 'ko' }, name: '발버둥' }, { language: { name: 'en' }, name: 'Struggle' }, { language: { name: 'ja' }, name: 'わるあがき' }],
      flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'A struggling attack.' }, { language: { name: 'ko' }, flavor_text: '발버둥치는 공격.' }]
    });
  }
  
  return selectedMoves;
}

export async function getMovesDetails(urls: string[]): Promise<MoveDetails[]> {
  if (!urls || urls.length === 0) return [];

  const fetchPromises = urls.map(async (url) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data: MoveDetails = await res.json();
        return data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);
  const validMoves = results.filter((m): m is MoveDetails => m !== null);
  
  if (validMoves.length === 0) {
    validMoves.push({
      id: 165,
      name: 'struggle',
      power: 50,
      accuracy: 100,
      type: { name: 'normal' },
      names: [{ language: { name: 'ko' }, name: '발버둥' }, { language: { name: 'en' }, name: 'Struggle' }, { language: { name: 'ja' }, name: 'わるあがき' }],
      flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'A struggling attack.' }, { language: { name: 'ko' }, flavor_text: '발버둥치는 공격.' }]
    });
  }
  
  return validMoves;
}
