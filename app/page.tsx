import { getRegions } from '../src/services/pokeapi';
import HomeContent from '../src/components/HomeContent';

export default async function Home() {
  const regions = await getRegions();

  return <HomeContent regions={regions} />;
}
