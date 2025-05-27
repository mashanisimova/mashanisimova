"use client"

import { useState } from 'react'
import { useBybitAuth, BybitCredentials } from '@/lib/hooks/useBybitAuth'
import { toast } from 'sonner'

export default function AuthForm() {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [testnet, setTestnet] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  const { isAuthenticated, connectToBybit, disconnect, error: authError } = useBybitAuth()

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const credentials: BybitCredentials = {
        apiKey,
        apiSecret,
        testnet
      }
      
      const success = await connectToBybit(credentials)
      
      if (success) {
        toast.success('Connected', {
          description: `Successfully connected to Bybit ${testnet ? 'Testnet' : 'Mainnet'}.`,
        })
        setApiKey('')
        setApiSecret('')
      } else {
        toast.error('Connection Failed', {
          description: authError || 'Failed to connect to Bybit API.',
        })
      }
    } catch (err: any) {
      toast.error('Error', {
        description: err.message || 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast.info('Disconnected', {
      description: 'Successfully disconnected from Bybit API.'
    })
  }

  if (isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-bybit-dark to-bybit-darker rounded-lg p-4 border border-bybit-darker/60 shadow-lg">
        <h3 className="text-bybit-yellow font-medium mb-2">Connected to Bybit</h3>
        <p className="text-sm text-gray-300 mb-4">You are connected to Bybit {testnet ? 'Testnet' : 'Mainnet'}.</p>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-bybit-red text-white rounded-md hover:bg-red-700 transition-all duration-300 transform hover:scale-[1.02] shadow-md"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-bybit-dark to-bybit-darker rounded-lg p-4 border border-bybit-darker/60 shadow-lg">
      <h3 className="text-bybit-yellow font-medium mb-2">Connect to Bybit</h3>
      <form onSubmit={handleConnect}>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
              API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-bybit-dark border border-bybit-darker/80 rounded-md text-white focus:ring-1 focus:ring-bybit-yellow focus:border-bybit-yellow/50 transition duration-200"
              placeholder="Enter your API key"
              required
            />
          </div>
          
          <div>
            <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-300 mb-1">
              API Secret
            </label>
            <input
              type="password"
              id="apiSecret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 bg-bybit-dark border border-bybit-darker/80 rounded-md text-white focus:ring-1 focus:ring-bybit-yellow focus:border-bybit-yellow/50 transition duration-200"
              placeholder="Enter your API secret"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="testnet"
              checked={testnet}
              onChange={(e) => setTestnet(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="testnet" className="text-sm text-gray-300">
              Use Testnet (recommended for testing)
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-bybit-yellow text-bybit-dark font-medium rounded-md hover:bg-yellow-500 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 shadow-md hover:shadow-bybit-yellow/30"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </form>
    </div>
  )
}
