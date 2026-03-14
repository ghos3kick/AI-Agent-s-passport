import { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { TONSCAN_BASE_URL } from '../utils/contract';
import { shortenAddress } from '../utils/format';

type MintStatus = 'idle' | 'pending' | 'success' | 'error';

export default function MintPassport() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const walletAddress = wallet?.account?.address ?? '';

  const [owner, setOwner] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [metadataUrl, setMetadataUrl] = useState('');
  const [status, setStatus] = useState<MintStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill owner from connected wallet
  useEffect(() => {
    if (walletAddress && !owner) {
      setOwner(walletAddress);
    }
  }, [walletAddress]);

  async function handleMint() {
    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    if (!owner) {
      setErrorMsg('Owner address is required');
      return;
    }

    setStatus('pending');
    setErrorMsg('');

    try {
      const initData = window.Telegram?.WebApp?.initData || '';

      const res = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          endpoint: endpoint.trim() || 'https://example.com',
          capabilities: capabilities.trim() || 'general',
          metadata: metadataUrl.trim() || 'https://example.com/metadata.json',
          telegramInitData: initData,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        try {
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        } catch {}
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Mint failed');
        try {
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
        } catch {}
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Network error. Try again.');
    }
  }

  if (!wallet) {
    return (
      <div className="page-enter flex-col gap-16">
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Get Passport</h2>
        <div className="status">Connect your wallet first</div>
        <button className="btn btn-primary" onClick={() => tonConnectUI.openModal()}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter flex-col gap-16">
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Get Passport</h2>
        <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: 14 }}>
          Register your AI agent on TON
        </p>
      </div>

      {status === 'success' ? (
        <div className="flex-col gap-12">
          <div className="card text-center" style={{ padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#9989;</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Passport Minted!
            </div>
            <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: 14 }}>
              Your agent passport has been created on TON blockchain.
            </p>
          </div>
          <a
            href={`${TONSCAN_BASE_URL}/address/${owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            View on TONScan
          </a>
          <button
            className="btn btn-primary"
            onClick={() => {
              setStatus('idle');
              setOwner(walletAddress);
              setEndpoint('');
              setCapabilities('');
              setMetadataUrl('');
            }}
          >
            Mint Another
          </button>
        </div>
      ) : (
        <div className="flex-col gap-12">
          <div className="form-group">
            <label>Owner Address</label>
            <input
              className="input"
              placeholder="EQ..."
              value={owner ? shortenAddress(owner, 8) : ''}
              readOnly
            />
            <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginTop: 4 }}>
              Using connected wallet address
            </div>
          </div>

          <div className="form-group">
            <label>Endpoint URL</label>
            <input
              className="input"
              placeholder="https://api.myagent.ai"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              maxLength={256}
            />
          </div>

          <div className="form-group">
            <label>Capabilities</label>
            <input
              className="input"
              placeholder="chat, code-generation, analysis"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              maxLength={256}
            />
          </div>

          <div className="form-group">
            <label>Metadata URL (TEP-64 JSON)</label>
            <input
              className="input"
              placeholder="https://example.com/metadata.json"
              value={metadataUrl}
              onChange={(e) => setMetadataUrl(e.target.value)}
              maxLength={256}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleMint}
            disabled={status === 'pending'}
          >
            {status === 'pending' ? (
              <>
                <div className="spinner" style={{ marginRight: 8 }} />
                Minting...
              </>
            ) : (
              'Mint Passport'
            )}
          </button>

          {status === 'error' && errorMsg && (
            <div className="status error">{errorMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}
