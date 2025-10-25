'use client';

import { useState, useEffect } from 'react';

interface EnvironmentConfig {
  apiId: string;
  apiHash: string;
}

export default function EnvironmentConfig() {
  const [config, setConfig] = useState<EnvironmentConfig>({
    apiId: '',
    apiHash: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if configuration exists in localStorage
    const savedConfig = localStorage.getItem('telegram_config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      setIsConfigured(true);
    }
  }, []);

  const handleSave = () => {
    if (!config.apiId || !config.apiHash) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    // Validate API ID is a number
    if (isNaN(Number(config.apiId))) {
      alert('API ID bir sayı olmalıdır');
      return;
    }

    // Save to localStorage
    localStorage.setItem('telegram_config', JSON.stringify(config));
    setIsConfigured(true);
    
    // Reload the page to apply new configuration
    window.location.reload();
  };


  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* Simple Background */}
        <div className="absolute inset-0 bg-black"></div>
        
        <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Telegram API Yapılandırması
            </h2>
            <p className="text-gray-400">
              Telegram API kimlik bilgilerinizi yapılandırın
            </p>
          </div>
          
          <div className="glass rounded-2xl p-8 shadow-2xl">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">API Kimlik Bilgileri</h3>
                  <p className="text-gray-400">Telegram API ID ve Hash değerlerinizi girin</p>
                </div>
                
                <div>
                  <label htmlFor="apiId" className="block text-sm font-medium text-gray-300 mb-2">
                    API ID
                  </label>
                  <input
                    id="apiId"
                    name="apiId"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                    placeholder="12345678"
                    value={config.apiId}
                    onChange={(e) => setConfig({ ...config, apiId: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="apiHash" className="block text-sm font-medium text-gray-300 mb-2">
                    API Hash
                  </label>
                  <input
                    id="apiHash"
                    name="apiHash"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                    placeholder="abcdef1234567890abcdef1234567890"
                    value={config.apiHash}
                    onChange={(e) => setConfig({ ...config, apiHash: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center items-center py-3 px-6 border border-white text-sm font-semibold rounded-lg text-white bg-black hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Yapılandırmayı Kaydet</span>
                  </div>
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-white/10 border border-white/20 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-3">
                API kimlik bilgilerini nasıl alırsınız:
              </h3>
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-white font-semibold">1.</span>
                  <span><a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 underline transition-colors duration-200">my.telegram.org</a> adresine gidin</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white font-semibold">2.</span>
                  <span>Telefon numaranızla giriş yapın</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white font-semibold">3.</span>
                  <span>"API development tools" bölümüne gidin</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white font-semibold">4.</span>
                  <span>Yeni bir uygulama oluşturun</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white font-semibold">5.</span>
                  <span>API ID ve API Hash değerlerini kopyalayın</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
