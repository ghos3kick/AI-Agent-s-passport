import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Home from './components/Home';
import WalletConnect from './components/WalletConnect';
import PassportViewer from './components/PassportViewer';
import MintPassport from './components/MintPassport';
import VerifyPassport from './components/VerifyPassport';
import Navigation from './components/Navigation';
import { TONCONNECT_MANIFEST_URL } from './utils/contract';

// Telegram WebApp injects #tgWebAppData=... into the URL hash,
// which conflicts with HashRouter. Clean it up before React mounts.
(function cleanTelegramHash() {
  const hash = window.location.hash;
  if (hash && !hash.startsWith('#/')) {
    window.location.hash = '#/';
  }
})();

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
  return (
    <>
      <TelegramBackButton />
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wallet" element={<WalletConnect />} />
          <Route path="/view" element={<PassportViewer />} />
          <Route path="/mint" element={<MintPassport />} />
          <Route path="/verify" element={<VerifyPassport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Navigation />
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
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TonConnectUIProvider>
  );
}
