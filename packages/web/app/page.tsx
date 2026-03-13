'use client';

import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { RegistryStats } from '@/components/registry/RegistryStats';
import { PassportGrid } from '@/components/passport/PassportGrid';
import { usePassports } from '@/hooks/usePassports';

export default function HomePage() {
  const { data: passports, isLoading } = usePassports(6, 0);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0098EA] to-blue-700 text-white py-20">
        <Container>
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Agent Passport Registry
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Soulbound identity and trust verification for AI agents on TON blockchain.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/explore"
                className="rounded-lg bg-white text-blue-700 px-6 py-3 font-semibold hover:bg-blue-50 transition-colors"
              >
                Explore Passports
              </Link>
              <Link
                href="/verify"
                className="rounded-lg border border-white/50 text-white px-6 py-3 font-semibold hover:bg-white/10 transition-colors"
              >
                Verify Agent
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="py-10 border-b border-gray-200">
        <Container>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Registry Stats</h2>
          <RegistryStats />
        </Container>
      </section>

      {/* Recent Passports */}
      <section className="py-12">
        <Container>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Passports</h2>
            <Link href="/explore" className="text-sm text-blue-600 hover:underline font-medium">
              View All →
            </Link>
          </div>

          {!isLoading && (!passports || passports.length === 0) ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🤖</div>
              <p>No passports registered yet.</p>
            </div>
          ) : (
            <PassportGrid passports={passports} loading={isLoading} skeletonCount={6} />
          )}
        </Container>
      </section>
    </div>
  );
}
