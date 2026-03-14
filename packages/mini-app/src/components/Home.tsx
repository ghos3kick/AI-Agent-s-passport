import { useState, useEffect, useRef, Component, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, PlusCircle, ShieldCheck } from 'lucide-react';
import { getRegistryInfo } from '../hooks/useTonApi';

class HomeErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Agent Passport</h2>
          <p style={{ color: 'var(--ap-text-secondary)', marginTop: 8 }}>Something went wrong. Try reloading.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return <>{value}</>;
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
    <>
      <div className="home-bg" />
      <div className="page home-content">
        {/* Hero */}
        <div className="home-hero home-element">
          <div className="home-logo">
            <svg width="68" height="68" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="url(#shield-gradient)" fillOpacity="0.15"/>
              <path d="M32 16L44 22V34C44 40.6 38.9 46.7 32 48C25.1 46.7 20 40.6 20 34V22L32 16Z"
                stroke="url(#shield-stroke)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
              <path d="M27 33L30 36L37 29" stroke="url(#shield-stroke)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="shield-gradient" x1="0" y1="0" x2="64" y2="64">
                  <stop stopColor="#3b82f6"/>
                  <stop offset="0.5" stopColor="#8b5cf6"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
                <linearGradient id="shield-stroke" x1="20" y1="16" x2="44" y2="48">
                  <stop stopColor="#3b82f6"/>
                  <stop offset="0.5" stopColor="#8b5cf6"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16, marginBottom: 4, color: 'var(--ap-text-primary)' }}>
            Agent Passport
          </h1>
          <p style={{ color: 'var(--ap-text-secondary)', fontSize: 14 }}>
            On-chain identity for AI agents on TON
          </p>
        </div>

        {/* Stats */}
        <div className="home-stats home-element">
          <div className="home-stat-card">
            <div className="home-stat-icon">
              <Shield size={16} color="var(--ap-accent)" />
            </div>
            <span className="home-stat-value">
              {stats.loading ? <span className="skeleton" style={{ display: 'inline-block', width: 28, height: 24 }} /> : <CountUp target={stats.totalPassports} />}
            </span>
            <span className="home-stat-label">Passports</span>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-icon">
              <ShieldCheck size={16} color="var(--ap-success)" />
            </div>
            <span className="home-stat-value">
              {stats.loading ? <span className="skeleton" style={{ display: 'inline-block', width: 28, height: 24 }} /> : <CountUp target={stats.totalPassports} />}
            </span>
            <span className="home-stat-label">Verified</span>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-icon" style={{ fontSize: 14, color: 'var(--ap-accent-purple)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ap-accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span className="home-stat-value">0.05</span>
            <span className="home-stat-label">TON / Mint</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="home-actions home-element">
          <div className="action-card" onClick={() => navigate('/mint')}>
            <PlusCircle className="action-card-icon" size={24} />
            <span className="action-card-title">Register</span>
            <span className="action-card-subtitle">New Passport</span>
          </div>
          <div className="action-card" onClick={() => navigate('/verify')}>
            <ShieldCheck className="action-card-icon" size={24} />
            <span className="action-card-title">Verify</span>
            <span className="action-card-subtitle">Passport</span>
          </div>
          <div className="action-card" onClick={() => navigate('/view')}>
            <Search className="action-card-icon" size={24} />
            <span className="action-card-title">Search</span>
            <span className="action-card-subtitle">Find Agent</span>
          </div>
          <div className="action-card" onClick={() => navigate('/wallet')}>
            <Shield className="action-card-icon" size={24} />
            <span className="action-card-title">My Wallet</span>
            <span className="action-card-subtitle">Passports</span>
          </div>
        </div>

        <p className="home-element" style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--ap-text-muted)', letterSpacing: '0.05em' }}>
          Powered by TON Blockchain
        </p>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <HomeErrorBoundary>
      <HomeContent />
    </HomeErrorBoundary>
  );
}
