'use client';

import Link from 'next/link';
import type { AgentPassportData } from '@agent-passport/sdk';
import { PassportStatus } from './PassportStatus';
import { Badge } from '@/components/ui/Badge';
import { shortenAddress, formatCapabilities } from '@/lib/utils';

interface PassportCardProps {
  passport: AgentPassportData;
}

export function PassportCard({ passport }: PassportCardProps) {
  const capabilities = formatCapabilities(passport.capabilities);

  return (
    <Link href={`/passport/${passport.address}`}>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">🤖 #{passport.index}</span>
          <PassportStatus isActive={passport.isActive} revokedAt={passport.revokedAt} />
        </div>

        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {capabilities.slice(0, 4).map((cap) => (
              <Badge key={cap} variant="secondary">
                {cap}
              </Badge>
            ))}
            {capabilities.length > 4 && (
              <Badge variant="secondary">+{capabilities.length - 4}</Badge>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1 mt-auto">
          {passport.endpoint && (
            <div className="truncate">
              <span className="text-gray-400">Endpoint: </span>
              <span className="font-mono">{passport.endpoint}</span>
            </div>
          )}
          <div>
            <span className="text-gray-400">TX: </span>
            <span className="font-semibold">{passport.txCount}</span>
          </div>
          <div className="truncate">
            <span className="text-gray-400">Owner: </span>
            <span className="font-mono text-xs">{shortenAddress(passport.ownerAddress)}</span>
          </div>
        </div>

        <div className="text-xs text-blue-600 font-medium mt-1">View Details →</div>
      </div>
    </Link>
  );
}
