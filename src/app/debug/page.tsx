'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    const config = localStorage.getItem('telegram_config');
    const session = localStorage.getItem('telegram_session');
    const user = localStorage.getItem('telegram_user');

    setLocalStorageData({
      config: config ? JSON.parse(config) : null,
      session: session ? `${session.substring(0, 20)}...` : null,
      user: user ? JSON.parse(user) : null,
    });
  }, []);

  const clearAll = () => {
    localStorage.removeItem('telegram_config');
    localStorage.removeItem('telegram_session');
    localStorage.removeItem('telegram_user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug - LocalStorage Data</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Telegram Config</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(localStorageData.config, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Session String</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {localStorageData.session || 'No session found'}
            </pre>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">User Data</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(localStorageData.user, null, 2)}
            </pre>
          </div>

          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
