import { useState } from 'react';
import { ShieldCheck, ShieldX, AlertTriangle, Search } from 'lucide-react';
import { verifyPassport } from '../hooks/useTonApi';
import { shortenAddress } from '../utils/format';
import PassportCard from './PassportCard';
import TrustScore from './TrustScore';
import { calculateTrustScoreLocal } from '../utils/reputation';
import type { PassportData } from '../hooks/useTonApi';

type VerifyStatus = 'idle' | 'loading' | 'verified' | 'revoked' | 'not-found';

export default function VerifyPassport() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [passport, setPassport] = useState<PassportData | undefined>();
  const [error, setError] = useState('');

  async function handleVerify() {
    const trimmed = address.trim();
    if (!trimmed) return;

    setStatus('loading');
    setError('');
    setPassport(undefined);

    try {
      const result = await verifyPassport(trimmed);

      if (!result.exists) {
        setStatus('not-found');
      } else if (!result.isActive) {
        setStatus('revoked');
        setOwnerAddress(result.ownerAddress);
        setPassport(result.passport);
      } else {
        setStatus('verified');
        setOwnerAddress(result.ownerAddress);
        setPassport(result.passport);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setStatus('not-found');
    }
  }

  return (
    <div className="page page-enter">
      <h2 className="page-title">Verify</h2>
      <p className="page-subtitle">Check passport authenticity on-chain</p>

      <div className="search-input-wrapper">
        <Search className="search-icon" />
        <input
          className="search-input"
          placeholder="Enter SBT or owner address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
      </div>

      <button
        className="btn-mint"
        onClick={handleVerify}
        disabled={status === 'loading' || !address.trim()}
        style={{ marginBottom: 24 }}
      >
        {status === 'loading' ? 'Verifying...' : 'Verify Passport'}
      </button>

      {/* Loading state */}
      {status === 'loading' && (
        <div style={{ padding: '20px 0' }}>
          <div className="scanning-bar" />
          <div className="scanning-text">Verifying on-chain...</div>
        </div>
      )}

      {/* Verified */}
      {status === 'verified' && (
        <div className="flex-col gap-16">
          <div className="verify-result">
            <div className="verify-checkmark">
              <ShieldCheck size={32} color="var(--ap-success)" />
            </div>
            <div className="verify-title success">Verified</div>
            <div className="verify-subtitle">
              Owner: <span className="mono">{shortenAddress(ownerAddress, 6)}</span>
            </div>
          </div>
          {passport && (
            <>
              <PassportCard passport={passport} animate />
              {(() => {
                const ts = calculateTrustScoreLocal(passport);
                return <TrustScore score={ts.total} level={ts.level} breakdown={ts.breakdown} />;
              })()}
            </>
          )}
        </div>
      )}

      {/* Revoked */}
      {status === 'revoked' && (
        <div className="flex-col gap-16">
          <div className="verify-result">
            <div className="verify-warning-mark">
              <AlertTriangle size={32} color="var(--ap-warning)" />
            </div>
            <div className="verify-title warning">Revoked</div>
            <div className="verify-subtitle">This passport has been revoked</div>
          </div>
          {passport && <PassportCard passport={passport} animate />}
        </div>
      )}

      {/* Not Found */}
      {status === 'not-found' && (
        <div className="verify-result">
          <div className="verify-x-mark">
            <ShieldX size={32} color="var(--ap-error)" />
          </div>
          <div className="verify-title error">Not Found</div>
          <div className="verify-subtitle">No passport found for this address</div>
          {error && (
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--ap-text-muted)' }}>{error}</p>
          )}
        </div>
      )}

      {/* Idle empty state */}
      {status === 'idle' && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>
          <p className="empty-state-title">Verify Authenticity</p>
          <p className="empty-state-text">Enter an address to verify its passport status on-chain</p>
        </div>
      )}
    </div>
  );
}
