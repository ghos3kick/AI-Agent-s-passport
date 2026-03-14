import { useState } from 'react';
import { verifyPassport } from '../hooks/useTonApi';
import { shortenAddress } from '../utils/format';
import PassportCard from './PassportCard';
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
    <div className="page-enter flex-col gap-16">
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Verify Passport</h2>

      <div className="form-group">
        <label>SBT or Owner Address</label>
        <input
          className="input"
          placeholder="EQ... or UQ... or 0:..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleVerify}
        disabled={status === 'loading' || !address.trim()}
      >
        {status === 'loading' ? <div className="spinner" /> : 'Verify'}
      </button>

      {status === 'verified' && (
        <div className="flex-col gap-12">
          <div className="card text-center" style={{ padding: 20 }}>
            <span className="badge badge-verified" style={{ fontSize: 16 }}>
              &#9989; Verified
            </span>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--tg-theme-hint-color)' }}>
              Owner: {shortenAddress(ownerAddress, 6)}
            </p>
          </div>
          {passport && <PassportCard passport={passport} />}
        </div>
      )}

      {status === 'revoked' && (
        <div className="flex-col gap-12">
          <div className="card text-center" style={{ padding: 20 }}>
            <span className="badge badge-revoked" style={{ fontSize: 16 }}>
              &#9888;&#65039; Revoked
            </span>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--tg-theme-hint-color)' }}>
              This passport has been revoked
            </p>
          </div>
          {passport && <PassportCard passport={passport} />}
        </div>
      )}

      {status === 'not-found' && (
        <div className="card text-center" style={{ padding: 20 }}>
          <span className="badge badge-not-found" style={{ fontSize: 16 }}>
            &#10060; Not Found
          </span>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--tg-theme-hint-color)' }}>
            No passport found for this address
          </p>
          {error && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
