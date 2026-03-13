'use client';

import Link from 'next/link';
import type { AgentPassportData } from '@agent-passport/sdk';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCapabilities } from '@/lib/utils';

interface VerifyResultProps {
  loading: boolean;
  hasPassport?: boolean;
  passports?: AgentPassportData[];
}

export function VerifyResult({ loading, hasPassport, passports }: VerifyResultProps) {
  if (loading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (hasPassport === undefined) return null;

  if (!hasPassport || !passports || passports.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="text-xl font-bold text-red-700 mb-2">❌ No Active Passport</div>
        <p className="text-red-600 text-sm">
          This address does not own any active Agent Passport from this registry.
        </p>
      </div>
    );
  }

  // Check if all are revoked
  const revokedPassports = passports.filter((p) => !p.isActive);
  if (revokedPassports.length > 0 && passports.every((p) => !p.isActive)) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
        <div className="text-xl font-bold text-yellow-700 mb-2">⚠️ Passport Revoked</div>
        <p className="text-yellow-600 text-sm">
          This address has a passport but it has been revoked.
        </p>
      </div>
    );
  }

  const activePassports = passports.filter((p) => p.isActive);

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-4">
      <div className="text-xl font-bold text-green-700">✅ Verified Agent</div>
      <p className="text-green-600 text-sm">
        This address owns {activePassports.length} active Agent Passport
        {activePassports.length > 1 ? 's' : ''}:
      </p>
      <ul className="space-y-3">
        {activePassports.map((p) => (
          <li key={p.address} className="bg-white rounded-lg p-4 border border-green-100">
            <div className="font-semibold text-gray-900">#{p.index}</div>
            {p.capabilities && (
              <div className="text-sm text-gray-600 mt-1">
                Capabilities: {formatCapabilities(p.capabilities).join(', ')}
              </div>
            )}
            <Link
              href={`/passport/${p.address}`}
              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
            >
              View Passport →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
