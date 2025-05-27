'use client';

import { useState, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Bell, QrCode, ArrowRight, Download } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function MobileApp() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const { theme } = useTheme();
  
  useEffect(() => {
    // Get current URL for QR code
    const url = window.location.origin;
    setAppUrl(url);
    
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Animated gradient background class
  const gradientBg = `bg-gradient-to-br from-bybit-dark to-bybit-darker relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-bybit-yellow/10 before:to-transparent before:opacity-0
    hover:before:opacity-100 before:transition-opacity before:duration-700 border-bybit-darker`;

  return (
    <div className={`transition-all duration-300 ease-in-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mobile Access</h1>
      </div>
      
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="mb-4 bg-bybit-darker">
          <TabsTrigger 
            value="setup" 
            className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
          >
            Setup
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="pwa" 
            className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
          >
            Install App
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Mobile Access</CardTitle>
                <CardDescription>
                  Scan the QR code to access your bot on mobile devices
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pb-6">
                <div className="bg-white p-3 rounded-lg mb-4">
                  <QRCode 
                    value={appUrl} 
                    size={200} 
                    logoImage="/bybit-logo.png"
                    logoWidth={50}
                    logoHeight={50}
                    qrStyle="dots"
                    eyeRadius={10}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Your personal access link:
                </p>
                <p className="text-sm font-mono text-center mb-4 text-bybit-yellow">
                  {appUrl}
                </p>
                <Button 
                  variant="outline" 
                  className="bg-bybit-darker border-bybit-darker hover:bg-bybit-yellow hover:text-black"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Share Link
                </Button>
              </CardContent>
            </Card>
            
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Companion Features</CardTitle>
                <CardDescription>
                  Available features on mobile devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-bybit-yellow/20 p-2 rounded-full">
                    <Bell className="h-5 w-5 text-bybit-yellow" />
                  </div>
                  <div>
                    <h3 className="font-medium text-bybit-text">Real-time Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive alerts for trades and important events</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-bybit-yellow/20 p-2 rounded-full">
                    <Smartphone className="h-5 w-5 text-bybit-yellow" />
                  </div>
                  <div>
                    <h3 className="font-medium text-bybit-text">Dashboard Access</h3>
                    <p className="text-sm text-muted-foreground">Monitor your bot's performance from anywhere</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-bybit-yellow/20 p-2 rounded-full">
                    <Download className="h-5 w-5 text-bybit-yellow" />
                  </div>
                  <div>
                    <h3 className="font-medium text-bybit-text">Offline Functionality</h3>
                    <p className="text-sm text-muted-foreground">Access key features even without internet connection</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
                  onClick={() => window.location.href = '/dashboard/mobile-app/pair'}
                >
                  Pair New Device
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="animate-in fade-in-50 duration-300">
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text">Push Notifications</CardTitle>
              <CardDescription>
                Configure mobile notifications for important events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <NotificationSetting 
                  title="Trade Executions" 
                  description="Get notified when a trade is opened or closed"
                  defaultEnabled={true}
                />
                
                <NotificationSetting 
                  title="Daily Reports" 
                  description="Receive daily performance summaries"
                  defaultEnabled={true}
                />
                
                <NotificationSetting 
                  title="Error Alerts" 
                  description="Be notified of system errors or connection issues"
                  defaultEnabled={true}
                />
                
                <NotificationSetting 
                  title="Market Volatility" 
                  description="Alerts when market conditions change significantly"
                  defaultEnabled={false}
                />
                
                <NotificationSetting 
                  title="Balance Updates" 
                  description="Notifications when account balance changes"
                  defaultEnabled={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pwa" className="animate-in fade-in-50 duration-300">
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text">Install as App</CardTitle>
              <CardDescription>
                Install Bybit Bot as a standalone application on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker">
                <h3 className="font-medium mb-2 text-bybit-text">On iOS:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Open this page in Safari</li>
                  <li>Tap the share icon at the bottom of the screen</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
              </div>
              
              <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker">
                <h3 className="font-medium mb-2 text-bybit-text">On Android:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Open this page in Chrome</li>
                  <li>Tap the three dots menu in the top right</li>
                  <li>Tap "Add to Home Screen"</li>
                  <li>Tap "Add" on the popup</li>
                </ol>
              </div>
              
              <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker">
                <h3 className="font-medium mb-2 text-bybit-text">On Desktop:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Open this page in Chrome or Edge</li>
                  <li>Click the install icon in the address bar</li>
                  <li>Click "Install" on the popup</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
              >
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Installing as an app enables offline access and faster loading
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationSetting({ title, description, defaultEnabled = false }) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  
  return (
    <div className="flex items-center justify-between pb-4 border-b border-bybit-darker">
      <div>
        <h3 className="font-medium text-bybit-text">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="relative">
        <input 
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
          id={`notification-${title}`}
        />
        <label 
          htmlFor={`notification-${title}`}
          className={`block w-12 h-6 rounded-full transition-colors duration-300 ${enabled ? 'bg-bybit-yellow' : 'bg-bybit-darker'}`}
        >
          <span 
            className={`block w-5 h-5 mt-0.5 ml-0.5 rounded-full bg-white transition-transform duration-300 ${enabled ? 'transform translate-x-6' : ''}`}
          />
        </label>
      </div>
    </div>
  );
}
