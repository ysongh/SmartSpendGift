import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    metaMask(),
    // Optional: add WalletConnect
    // walletConnect({ projectId: 'YOUR_PROJECT_ID' })
  ],
  transports: {
    [sepolia.id]: http(),
  },
})
