'use client';

import { useRegistryStats } from '@/hooks/useRegistryStats';
import { Skeleton } from '@/components/ui/Skeleton';
import { CopyButton } from '@/components/ui/CopyButton';
import { shortenAddress } from '@/lib/utils';

export function RegistryStats() {
  const { data, isLoading, error } = useRegistryStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-gray-400 py-8">
        Could not load registry stats.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Total Passports" value={String(data.nextItemIndex)} />
      <StatCard
        label="Registry"
        value={
          <span className="flex items-center gap-1.5 font-mono text-sm">
            {shortenAddress(data.address)}
            <CopyButton text={data.address} />
          </span>
        }
      />
      <StatCard label="Owner" value={shortenAddress(data.ownerAddress)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
