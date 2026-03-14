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
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-ap-text-muted py-8">
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
    <div className="rounded-2xl border border-ap-border bg-ap-secondary p-5 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      <div className="text-xs font-medium text-ap-text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-bold text-ap-text">{value}</div>
    </div>
  );
}
