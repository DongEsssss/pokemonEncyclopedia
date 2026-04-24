import { getRegions } from '../src/services/pokeapi';
import RegionCard from '../src/components/RegionCard';

export default async function Home() {
  const regions = await getRegions();

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
          Pokemon Battle Simulator
        </h1>
        <p className="mt-4 text-gray-600 text-lg">Select a region to choose your Pokemon!</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {regions.map((region) => (
          <RegionCard key={region.name} name={region.name} />
        ))}
      </div>
    </main>
  );
}
