"use client"

import { useWalletBalance } from '@/lib/hooks/useWallet'

interface WalletOverviewProps {
  client: any
}

export default function WalletOverview({ client }: WalletOverviewProps) {
  const { balances, loading, error } = useWalletBalance(client)
  
  if (loading) {
    return (
      <div className="bg-bybit-darker rounded-lg p-4 border border-gray-800 animate-pulse">
        <div className="h-5 w-1/3 bg-gray-700 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-700 rounded"></div>
          <div className="h-4 w-full bg-gray-700 rounded"></div>
          <div className="h-4 w-full bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-bybit-darker rounded-lg p-4 border border-gray-800">
        <h3 className="text-bybit-yellow font-medium mb-2">Wallet Balance</h3>
        <p className="text-red-500 text-sm">Error loading wallet data: {error}</p>
      </div>
    )
  }
  
  if (balances.length === 0) {
    return (
      <div className="bg-bybit-darker rounded-lg p-4 border border-gray-800">
        <h3 className="text-bybit-yellow font-medium mb-2">Wallet Balance</h3>
        <p className="text-gray-400 text-sm">No assets found in your wallet.</p>
      </div>
    )
  }
  
  // Calculate total USD value (simplified - in a real app, you would fetch USD rates)
  const totalValue = balances.reduce((sum, balance) => {
    if (balance.coin === 'USDT' || balance.coin === 'USD') {
      return sum + parseFloat(balance.total)
    }
    // This is a simplified calculation - in real app you'd fetch current rates
    return sum
  }, 0)
  
  return (
    <div className="bg-bybit-darker rounded-lg p-4 border border-gray-800">
      <h3 className="text-bybit-yellow font-medium mb-1">Wallet Balance</h3>
      <p className="text-2xl font-bold text-white mb-4">
        ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      
      <div className="space-y-3">
        {balances.map((balance) => (
          <div key={balance.coin} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{balance.coin}</p>
              <p className="text-xs text-gray-400">
                Available: {parseFloat(balance.free).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">
                {parseFloat(balance.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </p>
              {parseFloat(balance.locked) > 0 && (
                <p className="text-xs text-yellow-500">
                  {parseFloat(balance.locked).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} in orders
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
