'use client';

import React, { useState, useEffect } from 'react';
import { cronManager, ScheduledMessage } from '@/lib/cron-manager';

// ScheduledMessage interface is now imported from cron-manager

interface Chat {
  id: number;
  title: string;
  type: string;
  username?: string;
}

interface CronManagerProps {
  sessionString: string;
  selectedChats: Set<number>;
}

export default function CronManager({ sessionString, selectedChats }: CronManagerProps) {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    message: '',
    time: '09:00',
  });
  const [selectedGroup, setSelectedGroup] = useState<{key: string, messages: ScheduledMessage[]} | null>(null);

  useEffect(() => {
    fetchScheduledMessages();
    fetchChats();
  }, [sessionString]);

  const fetchScheduledMessages = async () => {
    try {
      // Use client-side cron manager
      const messages = cronManager.getAllScheduledMessages();
      setScheduledMessages(messages);
    } catch (error) {
      console.error('Failed to fetch scheduled messages:', error);
    }
  };

  const fetchChats = async () => {
    try {
      // Get API credentials from localStorage
      const config = localStorage.getItem('telegram_config');
      if (!config) {
        console.error('API configuration not found');
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
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedChats.size === 0) {
      setError('Lütfen en az bir sohbet seçin');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Seçili her sohbet için ayrı zamanlanmış mesaj oluştur
      const newScheduledMessages: ScheduledMessage[] = [];
      
      for (const chatId of selectedChats) {
        const scheduledMessage: ScheduledMessage = {
          id: Date.now().toString() + '-' + chatId,
          chatId: chatId,
          message: newMessage.message,
          cronExpression: convertTimeToCron(newMessage.time),
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        const success = cronManager.scheduleMessage(scheduledMessage);
        if (success) {
          newScheduledMessages.push(scheduledMessage);
        }
      }

      setScheduledMessages([...scheduledMessages, ...newScheduledMessages]);
      setNewMessage({ message: '', time: '09:00' });
      setShowCreateForm(false);
    } catch (error: any) {
      setError(error.message || 'Ağ hatası oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMessage = async (messageId: string, action: 'start' | 'stop') => {
    try {
      let success = false;
      
      if (action === 'start') {
        success = cronManager.startMessage(messageId);
      } else {
        success = cronManager.stopMessage(messageId);
      }

      if (success) {
        setScheduledMessages(prevMessages =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, isActive: action === 'start' } : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Bu zamanlanmış mesajı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const success = cronManager.deleteMessage(messageId);
      
      if (success) {
        setScheduledMessages(prevMessages => 
          prevMessages.filter((msg) => msg.id !== messageId)
        );
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleBulkDeleteMessages = async (messageIds: string[]) => {
    if (!confirm('Tüm mesajları silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      for (const messageId of messageIds) {
        cronManager.deleteMessage(messageId);
      }
      
      setScheduledMessages(prevMessages => 
        prevMessages.filter((msg) => !messageIds.includes(msg.id))
      );
    } catch (error) {
      console.error('Failed to delete messages:', error);
      // On error, refresh from server to get accurate state
      fetchScheduledMessages();
    }
  };

  const handleBulkToggleMessages = async (messageIds: string[], action: 'start' | 'stop') => {
    try {
      for (const messageId of messageIds) {
        if (action === 'start') {
          cronManager.startMessage(messageId);
        } else {
          cronManager.stopMessage(messageId);
        }
      }
      
      setScheduledMessages(prevMessages => 
        prevMessages.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, isActive: action === 'start' }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to toggle messages:', error);
      // On error, refresh from server to get accurate state
      fetchScheduledMessages();
    }
  };

  const getChatTitle = (chatId: number) => {
    const chat = chats.find((c) => c.id === chatId);
    return chat ? chat.title : `Chat ${chatId}`;
  };

  // Group messages by content and cron expression
  const groupMessages = () => {
    const groups: { [key: string]: ScheduledMessage[] } = {};
    
    scheduledMessages.forEach(message => {
      const key = `${message.message}-${message.cronExpression}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(message);
    });
    
    return groups;
  };

  const openGroupDialog = (groupKey: string, messages: ScheduledMessage[]) => {
    setSelectedGroup({ key: groupKey, messages });
  };

  const closeGroupDialog = () => {
    setSelectedGroup(null);
  };

  const convertTimeToCron = (time: string) => {
    // time format: "HH:MM" -> cron format: "MM HH * * *"
    const [hours, minutes] = time.split(':');
    return `${minutes} ${hours} * * *`;
  };

  const formatCronExpression = (cron: string) => {
    // Convert cron expression to user-friendly format
    const parts = cron.split(' ');
    if (parts.length === 5) {
      const [minute, hour] = parts;
      const formattedHour = hour.padStart(2, '0');
      const formattedMinute = minute.padStart(2, '0');
      return `Her gün ${formattedHour}:${formattedMinute}`;
    }
    return cron;
  };

  return (
    <div className="space-y-6">
      {/* Group Details Modal - Kare Format */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 rounded-lg shadow-2xl w-[500px] h-[500px] animate-fade-in">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Mesaj Detayları</h3>
                <button
                  onClick={closeGroupDialog}
                  className="text-white hover:text-gray-300 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 space-y-6 overflow-y-auto">
                {/* Mesaj İçeriği */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white">Mesaj İçeriği</label>
                  <div className="bg-black border border-white rounded-lg p-4 text-white text-sm min-h-[80px] flex items-start">
                    {selectedGroup.messages[0].message}
                  </div>
                </div>
                
                {/* Gönderim Saati */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white">Gönderim Saati</label>
                  <div className="bg-black border border-white rounded-lg p-4 text-white text-sm">
                    {formatCronExpression(selectedGroup.messages[0].cronExpression)}
                  </div>
                </div>
                
                {/* Hedef Sohbetler */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white">
                    Hedef Sohbetler ({selectedGroup.messages.length} adet)
                  </label>
                  <div className="bg-black border border-white rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedGroup.messages.map((message) => (
                        <div key={message.id} className="flex items-center justify-between bg-black border border-white/30 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">
                                {getChatTitle(message.chatId)}
                              </div>
                              <div className="text-gray-400 text-xs">
                                ID: {message.chatId}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium px-2 py-1 rounded ${message.isActive ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
                              {message.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleMessage(message.id, message.isActive ? 'stop' : 'start');
                                  closeGroupDialog();
                                }}
                                className="px-3 py-1 text-white text-sm border border-white rounded hover:bg-white hover:text-black transition-colors"
                              >
                                {message.isActive ? 'Durdur' : 'Başlat'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteMessage(message.id);
                                  closeGroupDialog();
                                }}
                                className="px-3 py-1 text-white text-sm border border-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={closeGroupDialog}
                  className="px-4 py-2 text-white text-sm border border-white rounded hover:bg-white hover:text-black transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Zamanlanmış Mesajlar</h1>
          <div className="flex items-center space-x-2 text-green-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Çalışıyor</span>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
        >
          {showCreateForm ? 'İptal' : 'Yeni Mesaj'}
        </button>
      </div>


      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-black border border-white/20 rounded-lg p-6 mb-6 animate-fade-in">
          <h4 className="text-lg font-bold text-white mb-4">Yeni Mesaj</h4>
          
          <form onSubmit={handleCreateMessage} className="space-y-4">
            <div>
              <label className="block text-sm text-white mb-2">Seçili Sohbetler</label>
              {selectedChats.size === 0 ? (
                <div className="w-full px-3 py-2 bg-black border border-white rounded text-gray-400 text-sm">
                  Sohbet seçilmedi
                </div>
              ) : (
                <div className="w-full px-3 py-2 bg-black border border-white rounded text-white text-sm">
                  {selectedChats.size} sohbet seçildi
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Mesaj</label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-black border border-white rounded text-white placeholder-gray-400 focus:outline-none focus:border-white"
                placeholder="Mesajınızı yazın..."
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Saat</label>
              <input
                type="time"
                value={newMessage.time}
                onChange={(e) => setNewMessage({ ...newMessage, time: e.target.value })}
                className="px-3 py-2 bg-black border border-white rounded text-white focus:outline-none focus:border-white"
                required
              />
            </div>

            {error && (
              <div className="text-white text-sm bg-black border border-white rounded p-2">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1 text-white text-sm"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1 bg-white text-black rounded text-sm disabled:opacity-50"
              >
                {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages List */}
      {scheduledMessages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Henüz mesaj yok</p>
        </div>
      ) : (
        <div className="bg-black border border-white/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black border-b border-white/30">
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-white">Mesaj</th>
                  <th className="px-4 py-2 text-left text-sm text-white">Saat</th>
                  <th className="px-4 py-2 text-left text-sm text-white">Durum</th>
                  <th className="px-4 py-2 text-left text-sm text-white">İşlem</th>
                  <th className="px-4 py-2 text-center text-sm text-white">Detay Gör</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {Object.entries(groupMessages()).map(([groupKey, messages]) => {
                  const firstMessage = messages[0];
                  const activeCount = messages.filter(m => m.isActive).length;
                  const totalCount = messages.length;
                  
                  return (
                    <tr key={groupKey} className="hover:bg-gray-800/30">
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-white text-sm max-w-xs truncate">
                            {firstMessage.message}
                          </span>
                          <span className="text-gray-400 text-xs">
                            ({totalCount} sohbet)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-white text-sm">
                        {formatCronExpression(firstMessage.cronExpression)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-sm ${activeCount > 0 ? 'text-green-400' : 'text-green-400'}`}>
                          {activeCount}/{totalCount} Aktif
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              const allActive = messages.every(m => m.isActive);
                              const messageIds = messages.map(m => m.id);
                              handleBulkToggleMessages(messageIds, allActive ? 'stop' : 'start');
                            }}
                            className="text-white text-sm hover:underline"
                          >
                            {activeCount === totalCount ? 'Hepsini Durdur' : 'Hepsini Başlat'}
                          </button>
                          <span className="text-gray-400">|</span>
                          <button
                            onClick={() => {
                              const messageIds = messages.map(m => m.id);
                              handleBulkDeleteMessages(messageIds);
                            }}
                            className="text-white text-sm hover:underline"
                          >
                            Hepsini Sil
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => openGroupDialog(groupKey, messages)}
                          className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors mx-auto"
                          title="Detayları Görüntüle"
                        >
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
