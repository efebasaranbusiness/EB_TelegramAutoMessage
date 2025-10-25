'use client';

import { useState, useEffect } from 'react';

interface ProfileProps {
  user: any;
  sessionString: string;
}

export default function Profile({ user, sessionString }: ProfileProps) {
  const [currentUser, setCurrentUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, [sessionString]);

  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/telegram/user', {
        headers: {
          'x-session-string': sessionString,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-blue-500/30">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Profil Yükleniyor</h3>
        <p className="text-slate-400 text-lg">Kullanıcı bilgileri alınıyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          {/* User Info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-gray-400 mb-4">
              {currentUser?.username ? `@${currentUser.username}` : 'Kullanıcı adı yok'}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium border border-green-500/30">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Aktif</span>
                </div>
              </span>
              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium border border-gray-500/30">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Telegram</span>
                </div>
              </span>
              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium border border-gray-500/30">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Yönetici Paneli</span>
                </div>
              </span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchCurrentUser}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg font-medium transition-all duration-200 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
              <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-800 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span>Profil Detayları</span>
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Ad</span>
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                {currentUser?.firstName || 'Belirtilmemiş'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Soyad</span>
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                {currentUser?.lastName || 'Belirtilmemiş'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Kullanıcı Adı</span>
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                {currentUser?.username ? `@${currentUser.username}` : 'Belirtilmemiş'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span>Kullanıcı ID</span>
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-mono">
                {currentUser?.id || 'Belirtilmemiş'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Sohbetler</h4>
          <p className="text-3xl font-bold text-green-400 mb-1">-</p>
          <p className="text-gray-400 text-sm">Toplam sohbet sayısı</p>
        </div>

        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Gruplar</h4>
          <p className="text-3xl font-bold text-blue-400 mb-1">-</p>
          <p className="text-gray-400 text-sm">Katıldığınız gruplar</p>
        </div>

        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 4h6V3H9v1z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Kanallar</h4>
          <p className="text-3xl font-bold text-purple-400 mb-1">-</p>
          <p className="text-gray-400 text-sm">Abone olduğunuz kanallar</p>
        </div>
      </div>
    </div>
  );
}
