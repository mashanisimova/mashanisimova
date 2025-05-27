import { useState, useEffect } from 'react';
import { RestClientV5 } from 'bybit-api';
import { initializeBybitClient } from '@/lib/api/bybit';

export type BybitCredentials = {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
};

export function useBybitAuth() {
  const [client, setClient] = useState<RestClientV5 | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTestnet, setIsTestnet] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Storage key for credentials
  const STORAGE_KEY = 'bybitCredentials';

  useEffect(() => {
    // Check if we have stored credentials
    const storedCredentials = localStorage.getItem(STORAGE_KEY);
    if (storedCredentials) {
      try {
        const credentials = JSON.parse(storedCredentials) as BybitCredentials;
        setApiKey(credentials.apiKey);
        setApiSecret(credentials.apiSecret);
        setIsTestnet(credentials.testnet);
        login(credentials);
      } catch (err) {
        console.error('Failed to parse stored credentials:', err);
        setError('Failed to load stored credentials');
      }
    }
  }, []);

  const login = async (credentials: BybitCredentials) => {
    try {
      setError(null);
      const { apiKey, apiSecret, testnet } = credentials;
      
      // Validate inputs
      if (!apiKey || !apiSecret) {
        setError('API Key and Secret are required');
        return false;
      }

      // Update state
      setApiKey(apiKey);
      setApiSecret(apiSecret);
      setIsTestnet(testnet);

      // Initialize the client
      const newClient = initializeBybitClient(apiKey, apiSecret, testnet);
      setClient(newClient);

      // Test the connection by fetching wallet balance
      try {
        await newClient.getWalletBalance({ accountType: 'SPOT' });
        setIsAuthenticated(true);
        
        // Store credentials locally
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
        
        console.log('Successfully connected to Bybit API');
        return true;
      } catch (err: any) {
        console.error('Authentication test failed:', err);
        setError(err.message || 'Failed to authenticate with Bybit API');
        setClient(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'An unexpected error occurred');
      setClient(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = () => {
    setClient(null);
    setApiKey("");
    setApiSecret("");
    setIsTestnet(true);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);

    console.log("Logged out from Bybit");
    // We'll handle the toast notification in the component
  };

  return {
    client,
    isAuthenticated,
    isTestnet,
    apiKey,
    apiSecret,
    error,
    login,
    connectToBybit: login, // Alias for compatibility
    logout,
    disconnect: logout // Alias for compatibility
  };
};
