'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLogin: (session: string, user: any) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [waitTime, setWaitTime] = useState<number | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get API credentials from localStorage
      const config = localStorage.getItem('telegram_config');
      if (!config) {
        setError('API configuration not found. Please configure your API credentials first.');
        setIsLoading(false);
        return;
      }

      const { apiId, apiHash } = JSON.parse(config);

      // Initialize Telegram client and send phone number
      const response = await fetch('/api/telegram/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, apiId, apiHash }),
      });

      if (response.ok) {
        setStep('code');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send verification code');
        
        // If flood wait, disable the form temporarily
        if (errorData.error && errorData.error.includes('Too many requests')) {
          if (errorData.waitTime) {
            setWaitTime(errorData.waitTime);
            const timer = setInterval(() => {
              setWaitTime(prev => {
                if (prev && prev > 0) {
                  return prev - 1;
                } else {
                  clearInterval(timer);
                  setIsLoading(false);
                  setError('');
                  return null;
                }
              });
            }, 1000);
          } else {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              setError('');
            }, 30000); // Wait 30 seconds before allowing retry
          }
        }
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get API credentials from localStorage
      const config = localStorage.getItem('telegram_config');
      if (!config) {
        setError('API configuration not found. Please configure your API credentials first.');
        setIsLoading(false);
        return;
      }

      const { apiId, apiHash } = JSON.parse(config);

      const response = await fetch('/api/telegram/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          phoneCode,
          apiId,
          apiHash,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.sessionString, data.user);
      } else if (data.requiresPassword) {
        setStep('password');
        setError('Please enter your 2FA password');
      } else {
        setError(data.error || 'Authentication failed');
        
        // If flood wait, disable the form temporarily
        if (data.error && data.error.includes('Too many requests')) {
          if (data.waitTime) {
            setWaitTime(data.waitTime);
            const timer = setInterval(() => {
              setWaitTime(prev => {
                if (prev && prev > 0) {
                  return prev - 1;
                } else {
                  clearInterval(timer);
                  setIsLoading(false);
                  setError('');
                  return null;
                }
              });
            }, 1000);
          }
        }
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get API credentials from localStorage
      const config = localStorage.getItem('telegram_config');
      if (!config) {
        setError('API configuration not found. Please configure your API credentials first.');
        setIsLoading(false);
        return;
      }

      const { apiId, apiHash } = JSON.parse(config);

      const response = await fetch('/api/telegram/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          phoneCode,
          password,
          apiId,
          apiHash,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.sessionString, data.user);
      } else {
        setError(data.error || 'Password verification failed');
        
        // If flood wait, disable the form temporarily
        if (data.error && data.error.includes('Too many requests')) {
          if (data.waitTime) {
            setWaitTime(data.waitTime);
            const timer = setInterval(() => {
              setWaitTime(prev => {
                if (prev && prev > 0) {
                  return prev - 1;
                } else {
                  clearInterval(timer);
                  setIsLoading(false);
                  setError('');
                  return null;
                }
              });
            }, 1000);
          }
        }
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Simple Background */}
      <div className="absolute inset-0 bg-black"></div>
      
      <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Telegram Yönetici Paneli
          </h2>
          <p className="text-gray-400">
            Profesyonel Telegram Yönetim Platformu
          </p>
        </div>
        
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={step === 'phone' ? handlePhoneSubmit : step === 'code' ? handleCodeSubmit : handlePasswordSubmit}>
            {step === 'phone' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Telefon Numarası</h3>
                  <p className="text-gray-400">Telegram hesabınızın telefon numarasını girin</p>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Telefon Numarası
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                    placeholder="+90 555 123 45 67"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {step === 'code' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Doğrulama Kodu</h3>
                  <p className="text-gray-400">Telefonunuza gönderilen kodu girin</p>
                </div>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                    Doğrulama Kodu
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
                    placeholder="12345"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {step === 'password' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">İki Faktörlü Kimlik Doğrulama</h3>
                  <p className="text-gray-400">2FA şifrenizi girin</p>
                </div>
                <div className="mb-4 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <div className="text-sm font-semibold text-purple-300">
                        İki Faktörlü Kimlik Doğrulama Gerekli
                      </div>
                      <div className="text-xs text-purple-400 mt-1">
                        Lütfen Telegram hesabınızın 2FA şifresini girin
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    2FA Şifresi
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Şifrenizi girin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-red-300 font-medium">{error}</div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || waitTime !== null}
                className="group relative w-full flex justify-center items-center py-3 px-6 border border-white text-sm font-semibold rounded-lg text-white bg-black hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {waitTime !== null ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Lütfen {Math.ceil(waitTime / 60)} dakika bekleyin</span>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Yükleniyor...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {step === 'phone' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      ) : step === 'code' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      )}
                    </svg>
                    <span>
                      {step === 'phone' 
                        ? 'Kod Gönder' 
                        : step === 'code' 
                          ? 'Kodu Doğrula' 
                          : 'Giriş Yap'
                      }
                    </span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {(step === 'code' || step === 'password') && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep(step === 'password' ? 'code' : 'phone')}
                className="text-sm text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors duration-200 flex items-center space-x-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>
                  {step === 'password' ? 'Doğrulama koduna geri dön' : 'Telefon numarasına geri dön'}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-400">
                API kimlik bilgilerinizi alın{' '}
                <a
                  href="https://my.telegram.org/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-300 transition-colors duration-200 font-medium"
                >
                  my.telegram.org
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
