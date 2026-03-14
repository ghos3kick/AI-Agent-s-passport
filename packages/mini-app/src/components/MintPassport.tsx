import { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Wallet, ExternalLink } from 'lucide-react';
import { Address } from '@ton/core';
import { TONSCAN_BASE_URL, buildPublicMintBody, buildPublicMintTransaction } from '../utils/contract';
import { shortenAddress } from '../utils/format';

type MintStatus = 'idle' | 'pending' | 'success' | 'error';
type MintMode = 'quick' | 'self';

const CAPABILITIES = ['DeFi', 'NFT', 'Trading', 'Analytics', 'Social', 'Gaming', 'Oracles', 'Bridge'];

export default function MintPassport() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const walletAddress = wallet?.account?.address ?? '';

  const [owner, setOwner] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [metadataUrl, setMetadataUrl] = useState('');
  const [status, setStatus] = useState<MintStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mintMode, setMintMode] = useState<MintMode>('quick');

  useEffect(() => {
    if (walletAddress && !owner) {
      setOwner(walletAddress);
    }
  }, [walletAddress]);

  function toggleCap(cap: string) {
    setSelectedCaps(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  }

  async function handleQuickMint() {
    setStatus('pending');
    setErrorMsg('');

    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const capsString = selectedCaps.length > 0 ? selectedCaps.join(', ') : 'general';

      const res = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          endpoint: endpoint.trim() || 'https://example.com',
          capabilities: capsString,
          metadata: metadataUrl.trim() || 'https://example.com/metadata.json',
          telegramInitData: initData,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Mint failed');
        try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'); } catch {}
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Network error. Try again.');
    }
  }

  async function handleSelfMint() {
    setStatus('pending');
    setErrorMsg('');

    try {
      const capsString = selectedCaps.length > 0 ? selectedCaps.join(', ') : 'general';
      const mintBody = buildPublicMintBody({
        owner: Address.parse(owner),
        endpoint: endpoint.trim() || 'https://example.com',
        capabilities: capsString,
        metadataUrl: metadataUrl.trim() || 'https://example.com/metadata.json',
      });

      const tx = buildPublicMintTransaction(mintBody);
      await tonConnectUI.sendTransaction(tx);

      setStatus('success');
      try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed');
      try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'); } catch {}
    }
  }

  async function handleMint() {
    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    if (!owner) {
      setErrorMsg('Owner address is required');
      return;
    }

    if (mintMode === 'quick') {
      handleQuickMint();
    } else {
      handleSelfMint();
    }
  }

  if (!wallet) {
    return (
      <div className="page page-enter">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'var(--ap-gradient-holo-subtle)',
            border: '1px solid var(--ap-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Wallet size={28} color="var(--ap-text-secondary)" />
          </div>
          <h2 className="page-title" style={{ marginBottom: 8 }}>Connect Wallet</h2>
          <p style={{ color: 'var(--ap-text-secondary)', fontSize: 13, marginBottom: 24 }}>
            Connect your TON wallet to mint a passport
          </p>
          <button className="btn-mint" onClick={() => tonConnectUI.openModal()}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <h2 className="page-title">Mint Passport</h2>
      <p className="page-subtitle">Register your AI agent on TON</p>

      {status === 'success' ? (
        <div className="flex-col gap-16">
          <div className="card mint-success-card text-center" style={{ padding: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid var(--ap-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'verify-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: 'var(--ap-glow-success)',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ap-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ap-success)', marginBottom: 4 }}>
              Passport Minted!
            </div>
            <p style={{ color: 'var(--ap-text-secondary)', fontSize: 13 }}>
              Your agent passport has been created on TON blockchain.
            </p>
          </div>
          <a
            href={`${TONSCAN_BASE_URL}/address/${owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ textDecoration: 'none', gap: 8 }}
          >
            <ExternalLink size={16} /> View on TONScan
          </a>
          <button
            className="btn-mint"
            onClick={() => {
              setStatus('idle');
              setOwner(walletAddress);
              setEndpoint('');
              setSelectedCaps([]);
              setMetadataUrl('');
              setMintMode('quick');
            }}
          >
            Mint Another
          </button>
        </div>
      ) : (
        <div className="flex-col gap-12">
          {/* Mint Mode Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <button
              className={mintMode === 'quick' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '10px 12px', fontSize: 13, borderRadius: 12 }}
              onClick={() => setMintMode('quick')}
              type="button"
            >
              ⚡ Quick Mint
            </button>
            <button
              className={mintMode === 'self' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '10px 12px', fontSize: 13, borderRadius: 12 }}
              onClick={() => setMintMode('self')}
              type="button"
            >
              🔐 Self Mint
            </button>
          </div>
          <div className="form-hint" style={{ textAlign: 'center', marginTop: -8, marginBottom: 4 }}>
            {mintMode === 'quick' ? 'Free — bot mints on your behalf' : '0.05 TON — you sign the transaction'}
          </div>

          {/* Owner */}
          <div className="form-group">
            <label className="form-label">Owner Address</label>
            <input
              className="form-input mono"
              value={owner ? shortenAddress(owner, 8) : ''}
              readOnly
            />
            <div className="form-hint">Using connected wallet address</div>
          </div>

          {/* Endpoint */}
          <div className="form-group">
            <label className="form-label">Endpoint URL</label>
            <input
              className="form-input"
              placeholder="https://api.myagent.ai"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              maxLength={256}
            />
            <div className="form-hint">Your agent's API endpoint</div>
          </div>

          {/* Capabilities */}
          <div className="form-group">
            <label className="form-label">Capabilities</label>
            <div className="cap-chips">
              {CAPABILITIES.map(cap => (
                <span
                  key={cap}
                  className={`cap-chip${selectedCaps.includes(cap) ? ' active' : ''}`}
                  onClick={() => toggleCap(cap)}
                >
                  {cap}
                </span>
              ))}
            </div>
            <div className="form-hint">Select your agent's capabilities</div>
          </div>

          {/* Metadata URL */}
          <div className="form-group">
            <label className="form-label">Metadata URL (TEP-64)</label>
            <input
              className="form-input mono"
              placeholder="https://example.com/metadata.json"
              value={metadataUrl}
              onChange={(e) => setMetadataUrl(e.target.value)}
              maxLength={256}
            />
          </div>

          {/* Mint Button */}
          <button
            className={`btn-mint${status === 'pending' ? ' loading' : ''}`}
            onClick={handleMint}
            disabled={status === 'pending'}
          >
            {status === 'pending' ? 'Minting...' : mintMode === 'self' ? 'Mint (0.05 TON)' : 'Mint Passport'}
          </button>

          {status === 'error' && errorMsg && (
            <div className="status error">{errorMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}
