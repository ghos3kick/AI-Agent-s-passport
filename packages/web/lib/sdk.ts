import { AgentPassportSDK } from '@agent-passport/sdk';
import { REGISTRY_ADDRESS, TONAPI_KEY, NETWORK } from './constants';

let sdkInstance: AgentPassportSDK | null = null;

export function getSDK(): AgentPassportSDK {
  if (!sdkInstance) {
    sdkInstance = new AgentPassportSDK({
      registryAddress: REGISTRY_ADDRESS,
      tonapiKey: TONAPI_KEY,
      network: NETWORK,
    });
  }
  return sdkInstance;
}
