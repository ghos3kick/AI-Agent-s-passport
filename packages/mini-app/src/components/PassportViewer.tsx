import { useState } from 'react';
import { getPassportByAddress, getPassportsByOwner } from '../hooks/useTonApi';
import type { PassportData } from '../hooks/useTonApi';
import PassportCard from './PassportCard';

export default function PassportViewer() {
  const [address, setAddress] = useState('');
  const [passports, setPassports] = useState<PassportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const trimmed = address.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setPassports([]);
    setSearched(true);

    try {
      // Try as passport SBT address first
      try {
        const passport = await getPassportByAddress(trimmed);
        setPassports([passport]);
        setLoading(false);
        return;
      } catch {
        // Not a passport address, try as owner
      }

      // Try as owner address
      const ownerPassports = await getPassportsByOwner(trimmed);
      setPassports(ownerPassports);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to search');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter flex-col gap-16">
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Search Passports</h2>

      <div className="form-group">
        <label>TON Address (passport or owner)</label>
        <input
          className="input"
          placeholder="EQ... or UQ... or 0:..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSearch}
        disabled={loading || !address.trim()}
      >
        {loading ? <div className="spinner" /> : 'Search'}
      </button>

      {error && <div className="status error">{error}</div>}

      {!loading && searched && passports.length === 0 && !error && (
        <div className="status">No passports found for this address</div>
      )}

      {passports.map((p) => (
        <PassportCard key={p.address} passport={p} />
      ))}
    </div>
  );
}
