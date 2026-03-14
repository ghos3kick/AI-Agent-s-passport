import { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Info } from 'lucide-react';
import Home from './components/Home';
import WalletConnect from './components/WalletConnect';
import PassportViewer from './components/PassportViewer';
import MintPassport from './components/MintPassport';
import VerifyPassport from './components/VerifyPassport';
import Navigation from './components/Navigation';
import HelpOverlay from './components/HelpOverlay';
import { TONCONNECT_MANIFEST_URL } from './utils/contract';

function TelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const tgApp = window.Telegram?.WebApp;
    if (!tgApp) return;

    const isRoot = location.pathname === '/';

    if (isRoot) {
      tgApp.BackButton.hide();
    } else {
      tgApp.BackButton.show();
      const handler = () => navigate('/');
      tgApp.BackButton.onClick(handler);
      return () => tgApp.BackButton.offClick(handler);
    }
  }, [location, navigate]);

  return null;
}

function AppContent() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <TelegramBackButton />

      <button
        className="help-toggle"
        onClick={() => setShowHelp(true)}
        aria-label="Help"
      >
        <Info size={20} />
      </button>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<WalletConnect />} />
        <Route path="/view" element={<PassportViewer />} />
        <Route path="/mint" element={<MintPassport />} />
        <Route path="/verify" element={<VerifyPassport />} />
      </Routes>
      <Navigation />

      <HelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const tgApp = window.Telegram?.WebApp;
    if (tgApp) {
      tgApp.ready();
      tgApp.expand();
    }
  }, []);

  return (
    <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
      <MemoryRouter initialEntries={['/']}>
        <AppContent />
      </MemoryRouter>
    </TonConnectUIProvider>
  );
}
