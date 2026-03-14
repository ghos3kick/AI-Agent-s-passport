import { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import { buildMintBody, buildMintTransaction, TONSCAN_BASE_URL} from '../utils/contract';;

const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS;

type MintStatus = 'idle' | 'pending' | 'success' | 'error';

export default function MintPassport() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const walletAddress = wallet?.account?.address ?? '';

  // Admin-only mint check
  const rawWallet = wallet?.account?.address ?? '';
  const isAdmin = ADMIN_ADDRESS && rawWallet && (() => {
    try {
      const w = Address.parse(rawWallet).toString();
      const a = Address.parse(ADMIN_ADDRESS).toString();
      return w === a;
    } catch { return false; }
  })();

  const [owner, setOwner] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [metadataUrl, setMetadataUrl] = useState('');
  const [status, setStatus] = useState<MintStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill owner with wallet address
  const effectiveOwner = owner || walletAddress;

  async function handleMint() {
    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    if (!effectiveOwner) {
      setErrorMsg('Owner address is required');
      return;
    }

    setStatus('pending');
    setErrorMsg('');

    try {
      const ownerAddr = Address.parse(effectiveOwner);

      const mintBody = buildMintBody({
        owner: ownerAddr,
        capabilities: capabilities.trim() || 'general',
        endpoint: endpoint.trim() || 'https://example.com',
        metadataUrl: metadataUrl.trim() || 'https://example.com/metadata.json',
      });

      const tx = buildMintTransaction(mintBody);
      await tonConnectUI.sendTransaction(tx);

      setStatus('success');

      // Haptic feedback
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch {}
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed');
    }
  }

  if (!wallet) {
    return (
      <div className="page-enter flex-col gap-16">
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Mint Passport</h2>
        <div className="status">Connect your wallet first to mint a passport</div>
        <button className="btn btn-primary" onClick={() => tonConnectUI.openModal()}>
          Connect Wallet
        </button>
      </div>
    );
  }


  if (!isAdmin) {
    return (
      <div className="page-enter flex-col gap-16">
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Mint Passport</h2>
        <div className="status">Only the Registry admin can mint new passports.</div>
        <p style={{ opacity: 0.6 }}>Contact the admin to request a passport.</p>
      </div>
    );
  }
  return (
    <div className="page-enter flex-col gap-16">
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Mint Passport</h2>

      {status === 'success' ? (
        <div className="flex-col gap-12">
          <div className="card text-center" style={{ padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#9989;</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Transaction Sent!
            </div>
            <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: 14 }}>
              Your passport mint transaction has been submitted to the network.
            </p>
          </div>
          <a
            href={`${TONSCAN_BASE_URL}/address/${walletAddress}`}
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
              setOwner('');
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
              placeholder={walletAddress ? `Default: your wallet` : 'EQ...'}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
            {walletAddress && !owner && (
              <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginTop: 4 }}>
                Will use connected wallet address
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Endpoint URL</label>
            <input
              className="input"
              placeholder="https://api.myagent.ai"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Capabilities</label>
            <input
              className="input"
              placeholder="chat, code-generation, analysis"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Metadata URL (TEP-64 JSON)</label>
            <input
              className="input"
              placeholder="https://example.com/metadata.json"
              value={metadataUrl}
              onChange={(e) => setMetadataUrl(e.target.value)}
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
                Sending...
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
