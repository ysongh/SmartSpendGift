import { http, createConfig } from 'wagmi'
import { tempoTestnet } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [tempoTestnet],
  connectors: [
    injected(),
    metaMask(),
    // Optional: add WalletConnect
    // walletConnect({ projectId: 'YOUR_PROJECT_ID' })
  ],
  multiInjectedProviderDiscovery: true, 
  transports: {
    [tempoTestnet.id]: http(),
  },
})
