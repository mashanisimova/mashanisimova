'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    apiSecret: '',
    testnet: true
  });
  
  const [telegramSettings, setTelegramSettings] = useState({
    botToken: '',
    chatId: ''
  });
  
  const [generalSettings, setGeneralSettings] = useState({
    darkMode: true,
    notifications: true,
    soundAlerts: false,
    timezone: 'UTC',
    autoUpdate: true
  });
  
  const [taxSettings, setTaxSettings] = useState({
    enabled: false,
    country: 'United States',
    autoExport: false,
    includeUnrealized: false
  });
  
  const handleSaveAPISettings = () => {
    // In a real app, we would save the API settings securely
    console.log('Saving API settings:', apiSettings);
    toast.success('API settings saved');
  };
  
  const handleSaveTelegramSettings = () => {
    console.log('Saving Telegram settings:', telegramSettings);
    toast.success('Telegram settings saved');
  };
  
  const handleSaveGeneralSettings = () => {
    console.log('Saving general settings:', generalSettings);
    toast.success('General settings saved');
  };
  
  const handleSaveTaxSettings = () => {
    console.log('Saving tax settings:', taxSettings);
    toast.success('Tax settings saved');
  };
  
  const handleTestTelegram = () => {
    if (!telegramSettings.botToken || !telegramSettings.chatId) {
      toast.error('Please enter both Bot Token and Chat ID');
      return;
    }
    
    toast.info('Testing Telegram connection...');
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Telegram test successful!');
    }, 1500);
  };
  
  return (
    <div className="animate-in fade-in-50 duration-500 space-y-6">
      <h1 className="text-2xl font-bold text-bybit-text mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Settings */}
        <Card className="bg-bybit-dark border-bybit-darker">
          <CardHeader>
            <CardTitle className="text-bybit-text">API Settings</CardTitle>
            <CardDescription>
              Configure your Bybit API connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                value={apiSettings.apiKey}
                onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                className="bg-bybit-darker text-bybit-text"
                placeholder="Enter your Bybit API key"
                type="password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                value={apiSettings.apiSecret}
                onChange={(e) => setApiSettings({...apiSettings, apiSecret: e.target.value})}
                className="bg-bybit-darker text-bybit-text"
                placeholder="Enter your Bybit API secret"
                type="password"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="testnet"
                checked={apiSettings.testnet}
                onCheckedChange={(checked) => setApiSettings({...apiSettings, testnet: checked})}
              />
              <Label htmlFor="testnet">Use Testnet</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveAPISettings}
              className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
            >
              Save API Settings
            </Button>
          </CardFooter>
        </Card>
        
        {/* Telegram Settings */}
        <Card className="bg-bybit-dark border-bybit-darker">
          <CardHeader>
            <CardTitle className="text-bybit-text">Telegram Settings</CardTitle>
            <CardDescription>
              Configure Telegram notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                value={telegramSettings.botToken}
                onChange={(e) => setTelegramSettings({...telegramSettings, botToken: e.target.value})}
                className="bg-bybit-darker text-bybit-text"
                placeholder="Enter your Telegram bot token"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Create a bot with @BotFather on Telegram to get a token
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                value={telegramSettings.chatId}
                onChange={(e) => setTelegramSettings({...telegramSettings, chatId: e.target.value})}
                className="bg-bybit-darker text-bybit-text"
                placeholder="Enter your Telegram chat ID"
              />
              <p className="text-xs text-muted-foreground">
                Send a message to @userinfobot on Telegram to get your ID
              </p>
            </div>
            
            <div className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                onClick={handleTestTelegram}
                className="bg-bybit-darker text-bybit-text hover:bg-bybit-yellow/20 hover:text-bybit-yellow"
              >
                Test Connection
              </Button>
              
              <Button 
                onClick={handleSaveTelegramSettings}
                className="bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* General Settings */}
        <Card className="bg-bybit-dark border-bybit-darker">
          <CardHeader>
            <CardTitle className="text-bybit-text">General Settings</CardTitle>
            <CardDescription>
              Configure application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode">Dark Mode</Label>
              <Switch
                id="darkMode"
                checked={generalSettings.darkMode}
                onCheckedChange={(checked) => setGeneralSettings({...generalSettings, darkMode: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Browser Notifications</Label>
              <Switch
                id="notifications"
                checked={generalSettings.notifications}
                onCheckedChange={(checked) => setGeneralSettings({...generalSettings, notifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="soundAlerts">Sound Alerts</Label>
              <Switch
                id="soundAlerts"
                checked={generalSettings.soundAlerts}
                onCheckedChange={(checked) => setGeneralSettings({...generalSettings, soundAlerts: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoUpdate">Auto-Update Data</Label>
              <Switch
                id="autoUpdate"
                checked={generalSettings.autoUpdate}
                onCheckedChange={(checked) => setGeneralSettings({...generalSettings, autoUpdate: checked})}
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                className="w-full h-10 px-3 py-2 rounded-md bg-bybit-darker text-bybit-text border border-bybit-darker/60"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Central Europe</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">China</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveGeneralSettings}
              className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
            >
              Save General Settings
            </Button>
          </CardFooter>
        </Card>
        
        {/* Tax Reporting Settings */}
        <Card className="bg-bybit-dark border-bybit-darker">
          <CardHeader>
            <CardTitle className="text-bybit-text">Tax Reporting</CardTitle>
            <CardDescription>
              Configure tax reporting settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="taxEnabled">Enable Tax Reporting</Label>
              <Switch
                id="taxEnabled"
                checked={taxSettings.enabled}
                onCheckedChange={(checked) => setTaxSettings({...taxSettings, enabled: checked})}
              />
            </div>
            
            {taxSettings.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={taxSettings.country}
                    onChange={(e) => setTaxSettings({...taxSettings, country: e.target.value})}
                    className="w-full h-10 px-3 py-2 rounded-md bg-bybit-darker text-bybit-text border border-bybit-darker/60"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoExport">Auto-Export Reports</Label>
                  <Switch
                    id="autoExport"
                    checked={taxSettings.autoExport}
                    onCheckedChange={(checked) => setTaxSettings({...taxSettings, autoExport: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeUnrealized">Include Unrealized Gains</Label>
                  <Switch
                    id="includeUnrealized"
                    checked={taxSettings.includeUnrealized}
                    onCheckedChange={(checked) => setTaxSettings({...taxSettings, includeUnrealized: checked})}
                  />
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-bybit-darker text-bybit-text hover:bg-bybit-yellow/20 hover:text-bybit-yellow"
                  >
                    Export Now
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-bybit-darker text-bybit-text hover:bg-bybit-yellow/20 hover:text-bybit-yellow"
                  >
                    Preview Report
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveTaxSettings}
              className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
              disabled={!taxSettings.enabled}
            >
              Save Tax Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
