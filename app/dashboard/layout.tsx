'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  BarChart, PieChart, Settings, Home, Menu, X, LineChart, 
  ArrowDownUp, BellRing, Sun, Moon, Zap, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5 mr-2" />,
  },
  {
    title: 'Analysis',
    href: '/dashboard/analysis',
    icon: <LineChart className="w-5 h-5 mr-2" />,
  },
  {
    title: 'Bots',
    href: '/dashboard/bots',
    icon: <Zap className="w-5 h-5 mr-2" />,
    badge: 'New',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5 mr-2" />,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Animation effect for loaded state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Gradient background classes
  const gradientBg = `bg-gradient-to-br from-bybit-dark to-bybit-darker relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-bybit-yellow/10 before:to-transparent before:opacity-0
    hover:before:opacity-100 before:transition-opacity before:duration-700 border border-bybit-darker/60 shadow-lg rounded-lg`;

  const MainContent = () => (
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className={`transition-all duration-500 ease-in-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        {children}
      </div>
    </main>
  );
  
  const Navigation = () => (
    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start transition-all duration-300 ${isActive ? 'bg-bybit-yellow text-black' : 'hover:bg-bybit-darker'}`}
            >
              {item.icon}
              {item.title}
              {item.badge && (
                <Badge className="ml-auto bg-bybit-green text-black">
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        );
      })}
    </div>
  );
  
  const ThemeToggle = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-bybit-darker border-bybit-darker">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer hover:bg-bybit-yellow hover:text-black">
          <Sun className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer hover:bg-bybit-yellow hover:text-black">
          <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer hover:bg-bybit-yellow hover:text-black">
          <Smartphone className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  
  // Mobile navigation drawer
  const MobileNavigation = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-bybit-dark border-bybit-darker w-[250px] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="text-bybit-yellow font-bold text-xl">Bybit Trading Bot</div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="px-4 flex-1">
            <Navigation />
          </div>
          <Card className={`m-4 ${gradientBg}`}>
            <div className="p-4 flex items-center justify-between">
              <div className="text-sm font-medium">Theme</div>
              <ThemeToggle />
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-bybit-dark to-bybit-darker text-bybit-text flex flex-col md:flex-row overflow-hidden border-b border-bybit-darker shadow-xl">
      {/* Mobile top navbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-bybit-darker/60 bg-gradient-to-r from-bybit-dark to-bybit-darker/90 shadow-md">
        <div className="flex items-center">
          <MobileNavigation />
          <div className="ml-3 text-bybit-yellow font-bold">Bybit Trading Bot</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <BellRing className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-bybit-green" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-bybit-darker/60 p-4 gap-4 bg-gradient-to-b from-bybit-dark to-bybit-darker/90">
        <div className="text-bybit-yellow font-bold text-xl mb-6">Bybit Trading Bot</div>
        <Navigation />
        
        <div className="mt-auto">
          <Card className={gradientBg}>
            <div className="p-4">
              <div className="text-sm font-medium mb-2">Bot Status</div>
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-bybit-green mr-2"></span>
                <span>Active</span>
                <ThemeToggle />
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Main content */}
      <MainContent />
      
      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="Toaster" />
      </div>
    </div>
  );
}