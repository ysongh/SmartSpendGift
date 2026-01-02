import { useState } from 'react';
import { createPublicClient, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { createBundlerClient } from 'viem/account-abstraction';
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit';
import { useAccount, useConnect, useDisconnect, useWalletClient, usePublicClient } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function SmartAccount() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [bundlerUrl, setBundlerUrl] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('0.001');

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const createSmartAccount = async () => {
    if (!address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected or clients not available');
    }

    if (!bundlerUrl.startsWith('http')) {
      throw new Error('Invalid bundler URL. Must start with http:// or https://');
    }

    setStatus('Creating smart account...');

    // Set up Bundler Client
    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(bundlerUrl),
    });

    setStatus('Creating MetaMask smart account with your wallet...');

    // Create MetaMask Smart Account using the connected wallet as signer
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [address, [], [], []],
      deploySalt: '0x',
      signer: { walletClient },
    });

    setSmartAccountAddress(smartAccount.address);
    setStatus(`Smart account created! Address: ${smartAccount.address}`);

    return { smartAccount, bundlerClient };
  };

  const previewSmartAccount = async () => {
    if (!isConnected) {
      setStatus('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setStatus('Generating smart account address...');

    try {
      await createSmartAccount();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendUserOperation = async () => {
    if (!isConnected) {
      setStatus('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setStatus('Preparing to send user operation...');

    try {
      if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
        throw new Error('Invalid recipient address format');
      }

      const { smartAccount, bundlerClient } = await createSmartAccount();

      // Check smart account balance
      setStatus('Checking smart account balance...');
      const balance = await publicClient?.getBalance({ address: smartAccount.address });
      const balanceInEth = Number(balance) / 1e18;
      
      if (balance === 0n) {
        setStatus(`⚠️ Smart account has no funds! Please send Sepolia ETH to: ${smartAccount.address}`);
        setLoading(false);
        return;
      }
      
      setStatus(`Smart account balance: ${balanceInEth.toFixed(6)} ETH`);

      setStatus('Estimating gas...');

      // Get gas estimates
      const gasPrice = await publicClient?.getGasPrice();
      const maxPriorityFeePerGas = 2000000000n;
      const maxFeePerGas = (gasPrice * 2n) + maxPriorityFeePerGas; 
      setStatus('Sending user operation...');

      // Send User Operation
      const userOperationHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [
          {
            to: recipientAddress,
            value: parseEther(amount),
          },
        ],
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      setTxHash(userOperationHash);
      setStatus(`User operation sent! Hash: ${userOperationHash}`);

      // Wait for receipt
      setStatus('Waiting for transaction confirmation...');
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
      });

      setStatus(`Transaction confirmed! Block: ${receipt.receipt.blockNumber}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">MetaMask Smart Account</h1>
              <p className="text-gray-600 text-sm">Connect wallet and create your smart account</p>
            </div>
          </div>

          {/* Wallet Connection Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Connected: {formatAddress(address)}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Not connected</span>
                  </>
                )}
              </div>
              <button
                onClick={() => isConnected ? disconnect() : connect({ connector: injected() })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isConnected
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Connect Wallet'}
              </button>
            </div>
          </div>

          {!isConnected && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                👆 Please connect your wallet to continue. Your wallet will be used as the owner/signer for the smart account.
              </p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bundler RPC URL
              </label>
              <input
                type="text"
                value={bundlerUrl}
                onChange={(e) => setBundlerUrl(e.target.value)}
                placeholder="https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!isConnected}
              />
              <p className="text-xs text-gray-500 mt-1">Get a free bundler from Pimlico, Alchemy, or Stackup</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!isConnected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (ETH)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!isConnected}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={previewSmartAccount}
              disabled={loading || !isConnected || !bundlerUrl}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Processing...' : 'Preview Smart Account'}
            </button>
            
            <button
              onClick={sendUserOperation}
              disabled={loading || !isConnected || !bundlerUrl || !recipientAddress || !smartAccountAddress}
              className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Processing...' : 'Send Transaction'}
            </button>
          </div>

          {status && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">Status:</p>
              <p className="text-sm text-blue-700 break-all">{status}</p>
            </div>
          )}

          {smartAccountAddress && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-2">Smart Account Address:</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-green-700 font-mono break-all flex-1">{smartAccountAddress}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(smartAccountAddress)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-green-300">
                <p className="text-xs text-green-800 font-semibold mb-1">⚠️ Important: Fund this address first!</p>
                <p className="text-xs text-green-700">
                  Send at least 0.01 Sepolia ETH to this smart account address before sending transactions.
                  Get free Sepolia ETH from{' '}
                  <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    sepoliafaucet.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {txHash && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 font-medium mb-1">Transaction Hash:</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-700 font-mono break-all hover:underline"
              >
                {txHash}
              </a>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> This demo uses Sepolia testnet. Your connected wallet must have Sepolia ETH to pay for gas.
              The smart account will be deployed automatically on the first transaction.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Setup Instructions</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Install dependencies: <code className="bg-gray-100 px-2 py-1 rounded">npm install @metamask/smart-accounts-kit viem wagmi @tanstack/react-query</code></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Set up Wagmi provider in your app (see setup code below)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Get Sepolia ETH from a faucet for your connected wallet</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Get a bundler API key from Pimlico, Alchemy, or Stackup</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span>Connect your wallet and enter bundler URL</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
