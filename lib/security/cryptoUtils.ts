/**
 * Secure cryptographic utilities for protecting API keys and sensitive data
 */

import { AES, enc, lib } from 'crypto-js';

// Salt for key derivation (in production this would be from env vars)
const SALT = 'bybit_bot_salt_12345';

// Generate encryption key from password
function deriveEncryptionKey(password: string): string {
  // In a real app, use a proper key derivation function like PBKDF2
  // This is a simplified version for demo purposes
  return password + SALT;
}

/**
 * Encrypt sensitive data with a password
 * @param data Sensitive data to encrypt
 * @param password User password for encryption
 * @returns Encrypted string
 */
export function encryptData(data: string, password: string): string {
  try {
    const key = deriveEncryptionKey(password);
    const encrypted = AES.encrypt(data, key);
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data with a password
 * @param encryptedData Encrypted string
 * @param password User password for decryption
 * @returns Decrypted data or null if decryption fails
 */
export function decryptData(encryptedData: string, password: string): string | null {
  try {
    const key = deriveEncryptionKey(password);
    const decrypted = AES.decrypt(encryptedData, key);
    return decrypted.toString(enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Securely store API keys in localStorage with encryption
 * @param apiKey Bybit API key
 * @param apiSecret Bybit API secret
 * @param password User password for encryption
 */
export function secureStoreApiKeys(apiKey: string, apiSecret: string, password: string): void {
  // Generate a session ID for audit trail
  const sessionId = generateSessionId();
  
  // Encrypt API credentials
  const encryptedApiKey = encryptData(apiKey, password);
  const encryptedApiSecret = encryptData(apiSecret, password);
  
  // Store encrypted credentials
  localStorage.setItem('bybit_api_key', encryptedApiKey);
  localStorage.setItem('bybit_api_secret', encryptedApiSecret);
  localStorage.setItem('last_session_id', sessionId);
  localStorage.setItem('last_login', new Date().toISOString());
  
  // Log access for audit trail (in production this would be server-side)
  logSecurityEvent('API_KEYS_STORED', sessionId);
}

/**
 * Retrieve and decrypt API keys from storage
 * @param password User password for decryption
 * @returns Object with API key and secret, or null if retrieval fails
 */
export function retrieveApiKeys(password: string): { apiKey: string; apiSecret: string } | null {
  try {
    const encryptedApiKey = localStorage.getItem('bybit_api_key');
    const encryptedApiSecret = localStorage.getItem('bybit_api_secret');
    
    if (!encryptedApiKey || !encryptedApiSecret) {
      return null;
    }
    
    const apiKey = decryptData(encryptedApiKey, password);
    const apiSecret = decryptData(encryptedApiSecret, password);
    
    if (!apiKey || !apiSecret) {
      return null;
    }
    
    // Log access for audit trail
    logSecurityEvent('API_KEYS_RETRIEVED', localStorage.getItem('last_session_id') || 'unknown');
    
    return { apiKey, apiSecret };
  } catch (error) {
    console.error('Error retrieving API keys:', error);
    return null;
  }
}

/**
 * Generate a unique session ID
 * @returns Session ID string
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Log security events for audit trail
 * @param eventType Type of security event
 * @param sessionId Current session ID
 */
export function logSecurityEvent(eventType: string, sessionId: string): void {
  const timestamp = new Date().toISOString();
  const event = {
    type: eventType,
    timestamp,
    sessionId,
    userAgent: navigator.userAgent
  };
  
  // In production, this would send logs to a secure server endpoint
  console.log('Security event:', event);
  
  // Store locally for demonstration purposes
  const securityLog = JSON.parse(localStorage.getItem('security_log') || '[]');
  securityLog.push(event);
  
  // Keep only last 100 events to prevent storage overflow
  if (securityLog.length > 100) {
    securityLog.shift();
  }
  
  localStorage.setItem('security_log', JSON.stringify(securityLog));
}

/**
 * Get security audit log
 * @returns Array of security events
 */
export function getSecurityAuditLog(): any[] {
  return JSON.parse(localStorage.getItem('security_log') || '[]');
}

/**
 * Clear all stored credentials and logs
 */
export function clearSecurityData(): void {
  localStorage.removeItem('bybit_api_key');
  localStorage.removeItem('bybit_api_secret');
  localStorage.removeItem('last_session_id');
  localStorage.removeItem('last_login');
  
  // Log the cleanup event before clearing logs
  logSecurityEvent('SECURITY_DATA_CLEARED', 'cleanup');
  localStorage.removeItem('security_log');
}
