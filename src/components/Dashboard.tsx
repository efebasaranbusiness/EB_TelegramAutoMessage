'use client';

import { useState } from 'react';
import Profile from './Profile';
import ChatsList from './ChatsList';
import CronManager from './CronManager';

interface DashboardProps {
  user: any;
  sessionString: string;
  onLogout: () => void;
}

export default function Dashboard({ user, sessionString, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'chats' | 'cron'>('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());

  const handleLogout = async () => {
    try {
      // Get API credentials from localStorage
      const config = localStorage.getItem('telegram_config');
      if (!config) {
        onLogout();
        return;
      }

      const { apiId, apiHash } = JSON.parse(config);

      const response = await fetch('/api/telegram/logout', {
        method: 'POST',
        headers: {
          'x-api-id': apiId,
          'x-api-hash': apiHash,
        },
      });
      
      if (response.ok) {
        onLogout();
      } else {
        console.error('Logout failed');
        onLogout(); // Still logout locally even if API call fails
      }
    } catch (error) {
      console.error('Logout error:', error);
      onLogout(); // Still logout locally even if API call fails
    }
  };

  const tabs = [
    { 
      id: 'profile', 
      name: 'Profil', 
      icon: 'user', 
      description: 'Hesap bilgileri',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'chats', 
      name: 'Sohbetler', 
      icon: 'chat', 
      description: 'Gruplar ve kanallar',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'cron', 
      name: 'Zamanlanmış', 
      icon: 'clock', 
      description: 'Otomatik mesajlar',
      color: 'from-purple-500 to-purple-600'
    },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full glass border-r border-gray-800">

          {/* User Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  @{user?.username || 'user'}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Çevrimiçi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 border ${
                  activeTab === tab.id
                    ? 'bg-black text-white border-white shadow-lg'
                    : 'text-white hover:bg-gray-800 hover:text-white border-gray-600'
                }`}
              >
                <div className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                  {tab.icon === 'user' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {tab.icon === 'chat' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  {tab.icon === 'clock' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{tab.name}</div>
                  <div className="text-xs opacity-70">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-white hover:bg-gray-800 hover:text-white transition-all duration-200 border border-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <div>
                <div className="font-medium text-sm">Çıkış Yap</div>
                <div className="text-xs opacity-70">Hesaptan çıkış yap</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className="glass border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="text-gray-400 text-sm">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Çevrimiçi</span>
              </div>
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in">
            {activeTab === 'profile' && <Profile user={user} sessionString={sessionString} />}
            {activeTab === 'chats' && (
              <ChatsList 
                sessionString={sessionString} 
                selectedChats={selectedChats}
                onSelectedChatsChange={setSelectedChats}
              />
            )}
            {activeTab === 'cron' && (
              <CronManager 
                sessionString={sessionString} 
                selectedChats={selectedChats}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
