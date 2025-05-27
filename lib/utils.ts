import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 2): string {
  if (value === null || value === undefined) return "0";
  
  // For very large numbers
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(2) + "B";
  }
  
  // For millions
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + "M";
  }
  
  // For thousands
  if (value >= 1000) {
    return (value / 1000).toFixed(2) + "K";
  }
  
  // Handle small numbers with appropriate precision
  if (value < 0.01 && value > 0) {
    return value.toFixed(6);
  }
  
  return value.toFixed(decimals);
}

export function formatDate(date: Date | number): string {
  const d = new Date(date);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
