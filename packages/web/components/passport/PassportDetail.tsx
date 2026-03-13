'use client';

import { useState } from 'react';
import type { AgentPassportData } from '@agent-passport/sdk';
import { PassportStatus } from './PassportStatus';
import { Badge } from '@/components/ui/Badge';
import { AddressLink } from '@/components/ui/AddressLink';
import { formatDate, formatCapabilities } from '@/lib/utils';

interface PassportDetailProps {
  passport: AgentPassportData;
}

export function PassportDetail({ passport }: PassportDetailProps) {
  const [rawOpen, setRawOpen] = useState(false);
  const capabilities = formatCapabilities(passport.capabilities);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🤖 Agent Passport #{passport.index}</h1>
          <p className="mt-1 font-mono text-sm text-gray-500">{passport.address}</p>
        </div>
        <PassportStatus isActive={passport.isActive} revokedAt={passport.revokedAt} />
      </div>

      {/* Main info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Passport Info</h2>

        <Row label="Owner">
          <AddressLink address={passport.ownerAddress} />
        </Row>

        {passport.endpoint && (
          <Row label="Endpoint">
            <a
              href={passport.endpoint}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm break-all"
            >
              {passport.endpoint}
            </a>
          </Row>
        )}

        {capabilities.length > 0 && (
          <Row label="Capabilities">
            <div className="flex flex-wrap gap-1">
              {capabilities.map((cap) => (
                <Badge key={cap} variant="secondary">
                  {cap}
                </Badge>
              ))}
            </div>
          </Row>
        )}

        <Row label="Transactions">
          <span className="font-semibold">{passport.txCount}</span>
        </Row>

        <Row label="Created">
          <span>{formatDate(passport.createdAt)}</span>
        </Row>

        <Row label="Collection">
          <AddressLink address={passport.collectionAddress} />
        </Row>
      </div>

      {/* TEP-85 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">TEP-85 SBT Details</h2>

        <Row label="Authority">
          <AddressLink address={passport.authorityAddress} />
        </Row>

        <Row label="Revoked At">
          <span>{passport.revokedAt ? formatDate(passport.revokedAt) : 'Not revoked'}</span>
        </Row>

        <Row label="Contract">
          <AddressLink address={passport.address} shorten={false} />
        </Row>
      </div>

      {/* Raw data */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => setRawOpen((v) => !v)}
          className="w-full flex items-center justify-between p-6 text-left font-semibold text-gray-900"
        >
          Raw Data (JSON)
          <span className="text-gray-400">{rawOpen ? '▲' : '▼'}</span>
        </button>
        {rawOpen && (
          <pre className="px-6 pb-6 text-xs font-mono text-gray-700 overflow-auto bg-gray-50 rounded-b-xl">
            {JSON.stringify(passport, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="w-32 text-sm font-medium text-gray-500 shrink-0">{label}</span>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  );
}
