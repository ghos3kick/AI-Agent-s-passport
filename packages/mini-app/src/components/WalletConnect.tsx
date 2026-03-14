import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useState, useEffect } from 'react';
import { shortenAddress } from '../utils/format';
import { getPassportsByOwner } from '../hooks/useTonApi';
import type { PassportData } from '../hooks/useTonApi';
import PassportCard from './PassportCard';

export default function WalletConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [passports, setPassports] = useState<PassportData[]>([]);
  const [loading, setLoading] = useState(false);

  const walletAddress = wallet?.account?.address;
  // Format: raw address from TON Connect is in raw format (0:hex)
  const displayAddress = walletAddress
    ? shortenAddress(walletAddress, 6)
    : '';

  useEffect(() => {
    if (!walletAddress) {
      setPassports([]);
      return;
    }
    setLoading(true);
    getPassportsByOwner(walletAddress)
      .then(setPassports)
      .catch(() => setPassports([]))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  return (
    <div className="page-enter flex-col gap-16">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Agent Passport</h1>
        <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: 14 }}>
          On-chain identity for AI agents on TON
        </p>
      </div>

      {!wallet ? (
        <div className="flex-col gap-12">
          <button
            className="btn btn-primary"
            onClick={() => tonConnectUI.openModal()}
          >
            Connect Wallet
          </button>
          <p className="text-center" style={{ color: 'var(--tg-theme-hint-color)', fontSize: 13 }}>
            Connect your TON wallet to manage agent passports
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

          <div className="section-title mt-8">My Passports</div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : passports.length > 0 ? (
            passports.map((p) => <PassportCard key={p.address} passport={p} />)
          ) : (
            <div className="status">
              No passports found for this wallet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
