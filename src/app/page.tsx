'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import EnvironmentConfig from '@/components/EnvironmentConfig';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionString, setSessionString] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if configuration exists
    const config = localStorage.getItem('telegram_config');
    if (config) {
      setIsConfigured(true);
    }

    // Check if user is already authenticated via API
    const checkSession = async () => {
      try {
        // Get API credentials from localStorage
        const config = localStorage.getItem('telegram_config');
        if (!config) {
          return;
        }

        const { apiId, apiHash } = JSON.parse(config);
        const response = await fetch(`/api/telegram/check-session?apiId=${apiId}&apiHash=${apiHash}`);
        const data = await response.json();
        
        if (data.success && data.hasSession && data.user) {
          setSessionString(data.sessionString);
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    if (isConfigured) {
      checkSession();
    }
  }, [isConfigured]);

  const handleLogin = (session: string, userData: any) => {
    setSessionString(session);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Save to localStorage
    localStorage.setItem('telegram_session', session);
    localStorage.setItem('telegram_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setSessionString(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('telegram_session');
    localStorage.removeItem('telegram_user');
  };

  const handleConfigurationComplete = () => {
    setIsConfigured(true);
  };

  if (!isConfigured) {
    return <EnvironmentConfig onConfigured={handleConfigurationComplete} />;
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard user={user} sessionString={sessionString!} onLogout={handleLogout} />;
}