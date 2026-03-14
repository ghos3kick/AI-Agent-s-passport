import type { PassportData } from '../hooks/useTonApi';
import { shortenAddress, formatDate } from '../utils/format';
import { TONSCAN_BASE_URL } from '../utils/contract';

interface Props {
  passport: PassportData;
}

export default function PassportCard({ passport }: Props) {
  return (
    <div className="card passport-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Passport #{passport.index}</span>
        <span className={`badge ${passport.isActive ? 'badge-verified' : 'badge-revoked'}`}>
          {passport.isActive ? 'Active' : 'Revoked'}
        </span>
      </div>

      <div className="field">
        <div className="field-label">Address</div>
        <div className="field-value mono">
          <a
            href={`${TONSCAN_BASE_URL}/address/${passport.address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--tg-theme-link-color)', textDecoration: 'none' }}
          >
            {shortenAddress(passport.address, 8)}
          </a>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Owner</div>
        <div className="field-value mono">{shortenAddress(passport.ownerAddress, 6)}</div>
      </div>

      {passport.capabilities && (
        <div className="field">
          <div className="field-label">Capabilities</div>
          <div className="field-value">{passport.capabilities}</div>
        </div>
      )}

      {passport.endpoint && (
        <div className="field">
          <div className="field-label">Endpoint</div>
          <div className="field-value mono" style={{ fontSize: 12 }}>{passport.endpoint}</div>
        </div>
      )}

      {passport.metadataUrl && (
        <div className="field">
          <div className="field-label">Metadata</div>
          <div className="field-value mono" style={{ fontSize: 12 }}>{passport.metadataUrl}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <div className="field-label">TX Count</div>
          <div className="field-value">{passport.txCount}</div>
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <div className="field-label">Created</div>
          <div className="field-value">{formatDate(passport.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}
