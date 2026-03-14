import { useState, useEffect, Component, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRegistryInfo } from '../hooks/useTonApi';

// Error boundary to prevent blank screen
class HomeErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <div className="page-enter flex-col gap-16" style={{ padding: '40px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Agent Passport</h2>
          <p style={{ color: 'var(--tg-theme-hint-color)' }}>Something went wrong. Try reloading.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function HomeContent() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPassports: 0, loading: true });

  useEffect(() => {
    getRegistryInfo()
      .then((info) => setStats({ totalPassports: info.nextItemIndex, loading: false }))
      .catch(() => setStats({ totalPassports: 0, loading: false }));
  }, []);

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

      {/* Quick Actions */}
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

      <p className="text-center" style={{ marginTop: 16, fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>
        Powered by TON Blockchain
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <HomeErrorBoundary>
      <HomeContent />
    </HomeErrorBoundary>
  );
}
