'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { PassportGrid } from '@/components/passport/PassportGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePassports } from '@/hooks/usePassports';
import type { AgentPassportData } from '@agent-passport/sdk';

const PAGE_SIZE = 12;

export default function ExplorePage() {
  const [offset, setOffset] = useState(0);
  const [allPassports, setAllPassports] = useState<AgentPassportData[]>([]);

  const { data, isLoading, isFetching } = usePassports(PAGE_SIZE, offset);

  // Accumulate passports as user loads more
  const combined = offset === 0 ? (data ?? []) : [...allPassports, ...(data ?? [])];
  const hasMore = data && data.length === PAGE_SIZE;

  const handleLoadMore = () => {
    setAllPassports(combined);
    setOffset((prev) => prev + PAGE_SIZE);
  };

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Passports</h1>
      <p className="text-gray-500 mb-8">All registered AI agent passports on TON.</p>

      {!isLoading && combined.length === 0 ? (
        <EmptyState
          icon="🤖"
          title="No passports yet"
          description="Be the first to register an Agent Passport!"
        />
      ) : (
        <>
          <PassportGrid passports={combined} loading={isLoading} skeletonCount={PAGE_SIZE} />

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {isFetching ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
