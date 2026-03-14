import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shortenAddress } from '../utils/format';
import { getRegistryInfo, getPassportsByOwner } from '../hooks/useTonApi';
import type { PassportData } from '../hooks/useTonApi';
import PassportCard from './PassportCard';

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalPassports: 0, loading: true });
  const [passports, setPassports] = useState<PassportData[]>([]);
  const [passportsLoading, setPassportsLoading] = useState(false);

  const walletAddress = wallet?.account?.address;
  const displayAddress = walletAddress ? shortenAddress(walletAddress, 6) : '';

  useEffect(() => {
    getRegistryInfo()
      .then((info) => setStats({ totalPassports: info.nextItemIndex, loading: false }))
      .catch(() => setStats({ totalPassports: 0, loading: false }));
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setPassports([]);
      return;
    }
    setPassportsLoading(true);
    getPassportsByOwner(walletAddress)
      .then(setPassports)
      .catch(() => setPassports([]))
      .finally(() => setPassportsLoading(false));
  }, [walletAddress]);

  return (
    <div className="page-enter flex-col gap-16">
      {/* Hero */}
      <div className="home-hero">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="16" fill="var(--tg-theme-button-color)" fillOpacity="0.15"/>
          <path d="M32 16L44 22V34C44 40.6 38.9 46.7 32 48C25.1 46.7 20 40.6 20 34V22L32 16Z"
            stroke="var(--tg-theme-button-color)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
          <path d="M27 33L30 36L37 29" stroke="var(--tg-theme-button-color)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Agent Passport</h1>
        <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: 14 }}>
          On-chain identity for AI agents on TON
        </p>
      </div>

      {/* Stats */}
      <div className="home-stats">
        <div className="card home-stat-card">
          <span className="home-stat-value">
            {stats.loading ? '...' : stats.totalPassports}
          </span>
          <span className="home-stat-label">Passports Minted</span>
        </div>
        <div className="card home-stat-card">
          <span className="home-stat-value">TON</span>
          <span className="home-stat-label">Testnet</span>
        </div>
      </div>

      {/* Actions */}
      {!wallet ? (
        <div className="flex-col gap-12">
          <button className="btn btn-primary" onClick={() => tonConnectUI.openModal()}>
            Connect Wallet
          </button>
          <p className="text-center" style={{ color: 'var(--tg-theme-hint-color)', fontSize: 13 }}>
            Connect your TON wallet to get started
          </p>
        </div>
      ) : (
        <div className="flex-col gap-12">
          <div className="card wallet-info">
            <div>
              <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>Connected</div>
              <div className="wallet-address">{displayAddress}</div>
            </div>
            <button
              className="btn btn-danger"
              style={{ width: 'auto', padding: '8px 16px', fontSize: 14 }}
              onClick={() => tonConnectUI.disconnect()}
            >
              Disconnect
            </button>
          </div>

          <div className="home-actions">
            <button className="btn btn-primary" onClick={() => navigate('/mint')}>
              Get Passport
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/view')}>
              Search Passport
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/verify')}>
              Verify Passport
            </button>
          </div>

          {/* My Passports */}
          <div className="section-title mt-8">My Passports</div>
          {passportsLoading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : passports.length > 0 ? (
            passports.map((p) => <PassportCard key={p.address} passport={p} />)
          ) : (
            <div className="status">No passports found for this wallet</div>
          )}
        </div>
      )}

      <p className="text-center" style={{ marginTop: 16, fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>
        Powered by TON Blockchain
      </p>
    </div>
  );
}
