import { Container } from './Container';
import { NETWORK, REGISTRY_ADDRESS } from '@/lib/constants';
import { shortenAddress } from '@/lib/utils';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <Container>
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>🤖 Agent Passport Registry</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
              {NETWORK}
            </span>
          </div>
          <div className="font-mono text-xs">
            Registry: {shortenAddress(REGISTRY_ADDRESS)}
          </div>
        </div>
      </Container>
    </footer>
  );
}
