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
      <section className="relative overflow-hidden bg-gradient-to-br from-ap-accent/20 via-ap-primary to-ap-primary py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_70%)]" />
        <Container>
          <div className="relative max-w-2xl animate-fade-in-up">
            <div className="mb-6">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path d="M40 4L72 20V48C72 62 58 74 40 78C22 74 8 62 8 48V20L40 4Z"
                  stroke="#3b82f6" strokeWidth="2" fill="rgba(59,130,246,0.08)" />
                <path d="M28 40L36 48L52 32"
                  stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight text-ap-text">
              Agent Passport Registry
            </h1>
            <p className="text-xl text-ap-text-secondary mb-8">
              Soulbound identity and trust verification for AI agents on TON blockchain.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/explore"
                className="rounded-lg bg-ap-accent text-white px-6 py-3 font-semibold hover:bg-ap-accent-hover hover:-translate-y-px hover:shadow-lg hover:shadow-ap-accent/25 transition-all"
              >
                Explore Passports
              </Link>
              <Link
                href="/verify"
                className="rounded-lg border border-ap-border text-ap-text-secondary px-6 py-3 font-semibold hover:border-ap-accent/40 hover:text-ap-text transition-all"
              >
                Verify Agent
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="py-10 border-b border-ap-divider">
        <Container>
          <h2 className="text-lg font-semibold text-ap-text-secondary mb-4">Registry Stats</h2>
          <RegistryStats />
        </Container>
      </section>

      {/* Recent Passports */}
      <section className="py-12">
        <Container>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-ap-text">Recent Passports</h2>
            <Link href="/explore" className="text-sm text-ap-accent hover:underline font-medium">
              View All →
            </Link>
          </div>

          {!isLoading && (!passports || passports.length === 0) ? (
            <div className="text-center py-16 text-ap-text-muted">
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
