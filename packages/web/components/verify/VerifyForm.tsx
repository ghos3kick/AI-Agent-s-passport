'use client';

import { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { isValidTonAddress } from '@agent-passport/sdk';

interface VerifyFormProps {
  onVerify: (address: string) => void;
  loading?: boolean;
}

export function VerifyForm({ onVerify, loading }: VerifyFormProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const walletAddress = useTonAddress();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = input.trim();
    if (!addr) {
      setError('Please enter an address');
      return;
    }
    if (!isValidTonAddress(addr)) {
      setError('Invalid TON address');
      return;
    }
    setError('');
    onVerify(addr);
  };

  const handleUseWallet = () => {
    if (walletAddress) {
      setInput(walletAddress);
      setError('');
      onVerify(walletAddress);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          TON Wallet Address
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="EQBx..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-[#0098EA] text-white px-4 py-2.5 font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        {walletAddress && (
          <button
            type="button"
            onClick={handleUseWallet}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Use connected wallet
          </button>
        )}
      </div>
    </form>
  );
}
