'use client';

import { useState, useEffect } from 'react';

interface Chat {
  id: number;
  title: string;
  type: 'channel' | 'group' | 'supergroup';
  username?: string;
  participantsCount?: number;
  description?: string;
  photo?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  isScam?: boolean;
  isRestricted?: boolean;
  accessHash?: string;
  inviteLink?: string;
}

interface ChatsListProps {
  sessionString: string;
  selectedChats: Set<number>;
  onSelectedChatsChange: (selectedChats: Set<number>) => void;
}

export default function ChatsList({ sessionString, selectedChats, onSelectedChatsChange }: ChatsListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'channel' | 'group' | 'supergroup'>('all');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchChats();
  }, [sessionString]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const fetchChats = async () => {
    setIsLoading(true);
    setError('');
    setLoadingProgress(0);
    setLoadingStep(0);
    
    try {
      // Step 1: Bağlantı kuruluyor
      setLoadingStep(1);
      setLoadingProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Sohbet listesi alınıyor
      setLoadingStep(2);
      setLoadingProgress(50);
      
      // Get API credentials from localStorage
      const config = localStorage.getItem('telegram_config');
      if (!config) {
        setError('API configuration not found');
        setIsLoading(false);
        return;
      }

      const { apiId, apiHash } = JSON.parse(config);

      const response = await fetch('/api/telegram/chats', {
        headers: {
          'x-session-string': sessionString,
          'x-api-id': apiId,
          'x-api-hash': apiHash,
        },
      });

      if (response.ok) {
        // Step 3: Profil fotoğrafları indiriliyor
        setLoadingStep(3);
        setLoadingProgress(75);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const data = await response.json();
        setChats(data.chats);
        
        // Step 4: Veriler işleniyor
        setLoadingStep(4);
        setLoadingProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Sohbetler alınamadı');
      }
    } catch (error) {
      setError('Ağ hatası oluştu');
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingStep(0);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'channel':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 4h6V3H9v1z" />
          </svg>
        );
      case 'group':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'supergroup':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'channel':
        return 'Kanal';
      case 'group':
        return 'Grup';
      case 'supergroup':
        return 'Süper Grup';
      default:
        return 'Sohbet';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'channel':
        return 'from-slate-600 to-slate-700';
      case 'group':
        return 'from-slate-500 to-slate-600';
      case 'supergroup':
        return 'from-slate-700 to-slate-800';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const toggleChatSelection = (chatId: number) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    onSelectedChatsChange(newSelected);
  };

  const selectAllChats = () => {
    const filteredChats = getFilteredChats();
    const allChatIds = filteredChats.map(chat => chat.id);
    onSelectedChatsChange(new Set(allChatIds));
  };

  const clearSelection = () => {
    onSelectedChatsChange(new Set());
  };

  const getFilteredChats = () => {
    return chats.filter(chat => {
      const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (chat.username && chat.username.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterType === 'all' || chat.type === filterType;
      return matchesSearch && matchesFilter;
    });
  };

  const getPaginatedChats = () => {
    const filteredChats = getFilteredChats();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredChats.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredChats = getFilteredChats();
    return Math.ceil(filteredChats.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        {/* Loading Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mb-8 shadow-lg border border-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-white"></div>
        </div>
        
        {/* Loading Text */}
        <h3 className="text-2xl font-bold text-white mb-2">Sohbetler Yükleniyor</h3>
        <p className="text-slate-400 text-lg mb-8">Telegram sohbetleriniz alınıyor...</p>
        
        {/* Progress Bar Container */}
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">İlerleme</span>
            <span className="text-sm text-gray-400">{loadingProgress}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-700 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white to-gray-200 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${loadingProgress}%` }}
            >
              <div className="h-full bg-gradient-to-r from-gray-100 to-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Loading Steps */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${loadingStep >= 1 ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
              <span className={`text-sm ${loadingStep >= 1 ? 'text-gray-400' : 'text-gray-500'}`}>
                Telegram bağlantısı kuruluyor...
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${loadingStep >= 2 ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
              <span className={`text-sm ${loadingStep >= 2 ? 'text-gray-400' : 'text-gray-500'}`}>
                Sohbet listesi alınıyor...
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${loadingStep >= 3 ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
              <span className={`text-sm ${loadingStep >= 3 ? 'text-gray-400' : 'text-gray-500'}`}>
                Profil fotoğrafları indiriliyor...
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${loadingStep >= 4 ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
              <span className={`text-sm ${loadingStep >= 4 ? 'text-gray-400' : 'text-gray-500'}`}>
                Veriler işleniyor...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredChats = getFilteredChats();

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sohbetler</h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-gray-400">Gruplar ve kanallar</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-400 font-medium">
                  {getFilteredChats().filter(chat => chat.type === 'channel').length} Kanal
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span className="text-green-400 font-medium">
                  {getFilteredChats().filter(chat => chat.type === 'group' || chat.type === 'supergroup').length} Grup
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-green-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Çevrimiçi</span>
          </div>
          <button
            onClick={fetchChats}
            className="p-2 bg-black hover:bg-white text-white hover:text-black rounded border border-gray-600 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Sohbet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="w-4 h-4 text-gray-400 hover:text-black hover:bg-white p-1 rounded transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'Tümü', icon: 'list', color: 'from-gray-500 to-gray-600' },
            { value: 'channel', label: 'Kanallar', icon: 'channel', color: 'from-blue-500 to-blue-600' },
            { value: 'group', label: 'Gruplar', icon: 'group', color: 'from-green-500 to-green-600' },
            { value: 'supergroup', label: 'Süper Gruplar', icon: 'supergroup', color: 'from-purple-500 to-purple-600' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value as any)}
              className={`group flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterType === filter.value
                  ? 'bg-white text-black border border-white'
                  : 'bg-black/50 text-white hover:bg-white/10 border border-white/20'
              }`}
            >
              <div className="w-4 h-4">
                {filter.icon === 'list' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                )}
                {filter.icon === 'channel' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 4h6V3H9v1z" />
                  </svg>
                )}
                {filter.icon === 'group' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {filter.icon === 'supergroup' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Error */}
      {error && (
        <div className="glass rounded-lg p-4 border border-red-500/30">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-red-300 font-medium text-sm">Hata Oluştu</h4>
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chats Table */}
      {getFilteredChats().length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchTerm || filterType !== 'all' ? 'Sohbet Bulunamadı' : 'Sohbet Mevcut Değil'}
          </h3>
          <p className="text-gray-400 text-sm">
            {searchTerm || filterType !== 'all' 
              ? 'Arama kriterlerinize uygun sohbet bulunamadı.' 
              : 'Telegram hesabınızda sohbet bulunamadı.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-black border border-white/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black border-b border-white/30">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={getFilteredChats().length > 0 && getFilteredChats().every(chat => selectedChats.has(chat.id))}
                        onChange={getFilteredChats().every(chat => selectedChats.has(chat.id)) ? clearSelection : selectAllChats}
                        className="w-4 h-4 text-white bg-black border border-white rounded focus:ring-white focus:ring-2 appearance-none checked:bg-white checked:border-white"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">Sohbet Adı</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">Sohbet Türü</span>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">Kullanıcı Adı</span>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">Üye Sayısı</span>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">Durum</span>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-sm font-semibold text-white">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {getPaginatedChats().map((chat) => (
                  <tr
                    key={chat.id}
                    className={`hover:bg-gray-800/30 transition-colors duration-200 ${
                      selectedChats.has(chat.id) ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedChats.has(chat.id)}
                        onChange={() => toggleChatSelection(chat.id)}
                        className="w-4 h-4 text-white bg-black border border-white rounded focus:ring-white focus:ring-2 appearance-none checked:bg-white checked:border-white"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {/* Chat Photo */}
                        <div className="relative">
                          {chat.photo ? (
                            <img
                              src={chat.photo}
                              alt={chat.title}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-700"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border border-gray-600 ${chat.photo ? 'hidden' : 'flex'}`}
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {chat.type === 'channel' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 4h6V3H9v1z" />
                              ) : chat.type === 'group' || chat.type === 'supergroup' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              )}
                            </svg>
                          </div>
                          {/* Online Status Indicator */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium truncate">
                            {chat.title}
                          </div>
                          {chat.description && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              {chat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-white font-medium">
                          {chat.type === 'channel' ? 'Kanal' : 
                           chat.type === 'group' ? 'Grup' : 
                           chat.type === 'supergroup' ? 'Süper Grup' : 'Sohbet'}
                        </span>
                        {chat.isPrivate && (
                          <span className="text-xs text-red-400">Özel</span>
                        )}
                        {chat.isVerified && (
                          <span className="text-xs text-green-400">Doğrulanmış</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-white">
                          {chat.username ? `@${chat.username}` : '-'}
                        </span>
                        {chat.inviteLink && (
                          <span className="text-xs text-blue-400">Davet Linki</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-white font-medium">
                          {chat.participantsCount ? chat.participantsCount.toLocaleString() : '-'}
                        </span>
                        {chat.participantsCount && (
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-400">Aktif</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`text-sm font-medium ${
                          chat.isRestricted ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {chat.isRestricted ? 'Kısıtlı' : 'Aktif'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {chat.isScam ? 'Dolandırıcı' : 'Güvenli'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-white hover:text-black hover:bg-white p-1 rounded transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {getTotalPages() > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/20">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">Sayfa başına satır</span>
                <select className="bg-black border border-white/30 text-white rounded px-2 py-1 text-sm">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">
                  Sayfa {currentPage}/{getTotalPages()}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-white text-white hover:text-black border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    «
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-white text-white hover:text-black border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages()}
                    className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-white text-white hover:text-black border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => handlePageChange(getTotalPages())}
                    disabled={currentPage === getTotalPages()}
                    className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-white text-white hover:text-black border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
