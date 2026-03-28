import { HomeClient } from "@/components/home/HomeClient";

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Tennis, explained.
        </h1>
        <p className="mt-2 text-gray-500 text-base max-w-xl">
          AI-powered match previews and surface-adjusted predictions for the
          tournaments that matter — in plain English, not raw stats.
        </p>
      </div>

      {/* Tournament cards — reacts to ATP/WTA toggle in Nav */}
      <HomeClient />
    </main>
  );
}
