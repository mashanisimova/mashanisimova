"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
}

// We're keeping only the default export to avoid duplicate declarations

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/bots', label: 'Trading Bots' },
    { href: '/dashboard/analysis', label: 'Market Analysis' },
    { href: '/dashboard/settings', label: 'Settings' },
  ]

  return (
    <div className="flex min-h-screen bg-bybit-dark">
      {/* Sidebar */}
      <div className="w-64 bg-bybit-darker border-r border-gray-800">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-bybit-yellow">Bybit Bot</h1>
          <p className="text-sm text-gray-400">Advanced Trading</p>
        </div>
        
        <nav className="mt-8">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-md ${pathname === item.href ? 'bg-bybit-yellow text-bybit-dark' : 'text-gray-300 hover:bg-gray-800'} transition-colors`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        <header className="border-b border-gray-800 bg-bybit-darker">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              {navItems.find(item => pathname === item.href)?.label || 'Dashboard'}
            </h2>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
