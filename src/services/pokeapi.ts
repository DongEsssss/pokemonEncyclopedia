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

// 포켓몬 종(Species) 정보 가져오기
export async function getPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
  const res = await fetch(`${API_BASE}/pokemon-species/${nameOrId}`);
  if (!res.ok) throw new Error('Failed to fetch pokemon species details');
  return await res.json();
}

// 모든 지역(Region) 목록 가져오기
export async function getRegions(): Promise<Region[]> {
  const res = await fetch(`${API_BASE}/region`);
  if (!res.ok) throw new Error('Failed to fetch regions');
  const data = await res.json();
  return data.results;
}

// 특정 지역의 도감(Pokedex) 목록 가져오기
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

// 포켓몬 상세 정보 가져오기
export async function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const res = await fetch(`${API_BASE}/pokemon/${nameOrId}`);
  if (!res.ok) throw new Error('Failed to fetch pokemon details');
  return await res.json();
}

// 랜덤한 기술 목록 가져오기
export async function getRandomMoves(movesList: PokemonMove[], count: number = 4): Promise<MoveDetails[]> {
  if (!movesList || movesList.length === 0) return [];
  
  const shuffled = [...movesList].sort(() => 0.5 - Math.random());
  const selectedMoves: MoveDetails[] = [];
  
  // 병렬 처리를 통해 속도 향상. 15개의 후보를 뽑아 병렬로 상세 정보를 가져온 후
  // 위력이 있는 기술들을 우선적으로 필터링하여 반환.
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
  
  // 위력이 있는 기술이 하나도 없을 경우 '발버둥'을 기본 기술로 제공
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

// 기술들의 상세 정보 가져오기
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
  
  // 유효한 기술이 없을 경우 '발버둥' 추가
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
