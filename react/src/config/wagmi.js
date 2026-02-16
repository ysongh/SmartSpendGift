import { http, createConfig } from 'wagmi'
import { tempoModerato } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { KeyManager, webAuthn } from 'wagmi/tempo'

export const wagmiConfig = createConfig({
  chains: [tempoModerato],
  connectors: [
    injected(),
    metaMask(),
    webAuthn({ 
      keyManager: KeyManager.localStorage(), 
    })
    // Optional: add WalletConnect
    // walletConnect({ projectId: 'YOUR_PROJECT_ID' })
  ],
  multiInjectedProviderDiscovery: true, 
  transports: {
    [tempoModerato.id]: http(),
  },
})
