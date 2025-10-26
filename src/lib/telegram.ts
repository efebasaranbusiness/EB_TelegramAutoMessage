import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  phoneNumber: string;
}

export interface TelegramChat {
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

export interface ScheduledMessage {
  id: string;
  chatId: number;
  message: string;
  cronExpression: string;
  isActive: boolean;
  createdAt: string;
  lastSent?: string;
}

class TelegramService {
  private client: TelegramClient | null = null;
  private apiId: number = 0;
  private apiHash: string = '';
  private sessionPath: string;
  private isAuthenticating: boolean = false;
  private lastRequestTime: number = 0;
  private requestCooldown: number = 5000; // 5 seconds between requests
  private floodWaitUntil: number = 0; // Timestamp when flood wait expires

  constructor() {
    this.sessionPath = process.env.TELEGRAM_SESSION_PATH || './sessions';
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    if (typeof window !== 'undefined') {
      // Browser environment - load from localStorage
      const config = localStorage.getItem('telegram_config');
      if (config) {
        try {
          const parsedConfig = JSON.parse(config);
          this.apiId = parseInt(parsedConfig.apiId || '0');
          this.apiHash = parsedConfig.apiHash || '';
        } catch (error) {
          console.error('Failed to parse telegram config:', error);
        }
      }
    } else {
      // Server environment - fallback to env variables
      this.apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
      this.apiHash = process.env.TELEGRAM_API_HASH || '';
    }
  }

  public isConfigured(): boolean {
    return this.apiId > 0 && this.apiHash.length > 0;
  }

  public setConfiguration(apiId: number, apiHash: string): void {
    this.apiId = apiId;
    this.apiHash = apiHash;
  }

  // Check if user has a valid session
  async checkExistingSession(): Promise<{ hasSession: boolean; user?: TelegramUser; sessionString?: string }> {
    try {
      // Try to load existing session from localStorage (browser) or file (server)
      let sessionString: string | null = null;
      
      if (typeof window !== 'undefined') {
        // Browser environment
        sessionString = localStorage.getItem('telegram_session');
      } else {
        // Server environment - try to read from file
        const fs = require('fs');
        if (fs.existsSync(this.sessionPath)) {
          sessionString = fs.readFileSync(this.sessionPath, 'utf8');
        }
      }

      if (!sessionString) {
        return { hasSession: false };
      }

      // Initialize client with existing session
      const initialized = await this.initialize(sessionString);
      if (!initialized || !this.client) {
        return { hasSession: false };
      }

      // Try to get user info to verify session is valid
      try {
        const me = await this.client.getMe();
        const user: TelegramUser = {
          id: me.id.toJSNumber(),
          firstName: me.firstName || '',
          lastName: me.lastName,
          username: me.username,
          phoneNumber: me.phone || '',
        };

        return { hasSession: true, user, sessionString };
      } catch (error) {
        // Session is invalid, clear it
        await this.clearSession();
        return { hasSession: false };
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      return { hasSession: false };
    }
  }

  // Clear session (logout)
  async clearSession(): Promise<void> {
    try {
      // Disconnect client
      if (this.client && this.client.connected) {
        await this.client.disconnect();
      }
      this.client = null;

      // Clear session from storage
      if (typeof window !== 'undefined') {
        // Browser environment
        localStorage.removeItem('telegram_session');
        localStorage.removeItem('telegram_user');
      } else {
        // Server environment - delete session file
        const fs = require('fs');
        if (fs.existsSync(this.sessionPath)) {
          fs.unlinkSync(this.sessionPath);
        }
      }

      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Save session
  private async saveSession(sessionString: string, user: TelegramUser): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment
        localStorage.setItem('telegram_session', sessionString);
        localStorage.setItem('telegram_user', JSON.stringify(user));
      } else {
        // Server environment - save to file
        const fs = require('fs');
        fs.writeFileSync(this.sessionPath, sessionString);
      }
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private canMakeRequest(): { canRequest: boolean; waitTime?: number; error?: string } {
    const now = Date.now();
    
    // Check if we're in a flood wait period
    if (this.floodWaitUntil > now) {
      const waitTime = Math.ceil((this.floodWaitUntil - now) / 1000);
      return {
        canRequest: false,
        waitTime,
        error: `Too many requests. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`
      };
    }
    
    // Check if we're already authenticating
    if (this.isAuthenticating) {
      return {
        canRequest: false,
        error: 'Authentication already in progress. Please wait.'
      };
    }
    
    // Check cooldown between requests (increased to 10 seconds to prevent flood)
    if (now - this.lastRequestTime < 10000) {
      const waitTime = Math.ceil((10000 - (now - this.lastRequestTime)) / 1000);
      return {
        canRequest: false,
        waitTime,
        error: `Please wait ${waitTime} seconds before making another request.`
      };
    }
    
    return { canRequest: true };
  }

  private setFloodWait(seconds: number): void {
    this.floodWaitUntil = Date.now() + (seconds * 1000);
  }

  async initialize(sessionString?: string): Promise<boolean> {
    try {
      console.log('Initializing Telegram client...');
      console.log('Session string provided:', !!sessionString);
      console.log('Session string length:', sessionString?.length || 0);
      console.log('API ID:', this.apiId);
      console.log('API Hash:', this.apiHash ? '***' : 'missing');
      
      const stringSession = new StringSession(sessionString || '');
      
      this.client = new TelegramClient(
        stringSession,
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 5,
        }
      );

      // Only start if we have a session string (already authenticated)
      if (sessionString) {
        console.log('Starting Telegram client with session...');
        await this.client.start({
          phoneNumber: async () => {
            throw new Error('Phone number required for authentication');
          },
          password: async () => {
            throw new Error('Password required for authentication');
          },
          phoneCode: async () => {
            throw new Error('Phone code required for authentication');
          },
          onError: (err) => {
            console.error('Telegram client error:', err);
          },
        });
        console.log('Telegram client started successfully');
        console.log('Client connected:', this.client.connected);
        console.log('Client ready:', this.client.ready);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize Telegram client:', error);
      return false;
    }
  }

  async sendPhoneNumber(phoneNumber: string): Promise<{ success: boolean; error?: string; waitTime?: number }> {
    // Check if configuration is available
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'Telegram API configuration not found. Please configure your API credentials first.' 
      };
    }

    // Check if we can make a request
    const requestCheck = this.canMakeRequest();
    if (!requestCheck.canRequest) {
      return { 
        success: false, 
        error: requestCheck.error,
        waitTime: requestCheck.waitTime 
      };
    }

    this.isAuthenticating = true;
    this.lastRequestTime = Date.now();

    try {
      // Don't disconnect existing client if we're in the middle of authentication
      // Only disconnect if we're starting fresh
      if (this.client && this.client.connected && !this.isAuthenticating) {
        await this.client.disconnect();
        this.client = null;
      }

      // Initialize client without session (for new authentication)
      // Only initialize if we don't have a client or it's not connected
      if (!this.client || !this.client.connected) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, error: 'Failed to initialize Telegram client' };
        }
      }

      // Connect client if not connected
      if (!this.client || !this.client.connected) {
        await this.client!.connect();
      }

      // Send code to phone number
      if (!this.client) {
        return { success: false, error: 'Client not initialized' };
      }
      
      await this.client.sendCode({
        apiId: this.apiId,
        apiHash: this.apiHash,
      }, phoneNumber);
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to send phone number:', error);
      
      // Handle flood wait error
      if (error.message && error.message.includes('FLOOD')) {
        const waitTime = error.seconds || 0;
        this.setFloodWait(waitTime);
        return { 
          success: false, 
          error: `Too many requests. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`,
          waitTime 
        };
      }
      
      return { success: false, error: error.message || 'Failed to send verification code' };
    } finally {
      this.isAuthenticating = false;
    }
  }

  async verifyPhoneCode(phoneNumber: string, phoneCode: string): Promise<{ success: boolean; sessionString?: string; user?: TelegramUser; requiresPassword?: boolean; error?: string }> {
    // Check if configuration is available
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'Telegram API configuration not found. Please configure your API credentials first.' 
      };
    }

    // Check if we can make a request
    const requestCheck = this.canMakeRequest();
    if (!requestCheck.canRequest) {
      return { 
        success: false, 
        error: requestCheck.error
      };
    }

    if (!this.client) {
      return { success: false, error: 'Client not initialized. Please send phone number first.' };
    }

    this.isAuthenticating = true;
    this.lastRequestTime = Date.now();

    try {
      // Connect client if not connected
      if (!this.client.connected) {
        await this.client.connect();
      }

      // Try to sign in with phone code only
      const result = await this.client.start({
        phoneNumber: async () => phoneNumber,
        phoneCode: async () => phoneCode,
        onError: (err) => {
          console.error('Authentication error:', err);
        },
      });

      // Check if 2FA is required
      if (result && typeof result === 'object' && 'password' in result) {
        // 2FA is required, return requiresPassword flag
        return { 
          success: false, 
          requiresPassword: true, 
          error: '2FA password required' 
        };
      }

      // If we get here, authentication was successful (no 2FA)
      const me = await this.client.getMe();
      const sessionString = this.client.session.save() as unknown as string;

      const user: TelegramUser = {
        id: me.id.toJSNumber(),
        firstName: me.firstName || '',
        lastName: me.lastName,
        username: me.username,
        phoneNumber: phoneNumber,
      };

      // Save session
      await this.saveSession(sessionString, user);

      return { success: true, sessionString, user };
    } catch (error: any) {
      console.error('Authentication failed:', error);
      
      // Handle flood wait error
      if (error.message && error.message.includes('FLOOD')) {
        const waitTime = error.seconds || 0;
        this.setFloodWait(waitTime);
        return { 
          success: false, 
          error: `Too many requests. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`
        };
      }
      
      // Check if 2FA password is required
      if (error.message && (error.message.includes('password') || error.message.includes('2FA') || error.message.includes('PASSWORD_HASH_INVALID'))) {
        return { success: false, requiresPassword: true, error: '2FA password required' };
      }
      
      return { success: false, error: error.message || 'Authentication failed' };
    } finally {
      this.isAuthenticating = false;
    }
  }

  async verifyPassword(phoneNumber: string, phoneCode: string, password: string): Promise<{ success: boolean; sessionString?: string; user?: TelegramUser; error?: string }> {
    // Check if configuration is available
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'Telegram API configuration not found. Please configure your API credentials first.' 
      };
    }

    // Check if we can make a request
    const requestCheck = this.canMakeRequest();
    if (!requestCheck.canRequest) {
      return { 
        success: false, 
        error: requestCheck.error
      };
    }

    this.isAuthenticating = true;
    this.lastRequestTime = Date.now();

    try {
      // Disconnect any existing client to prevent conflicts
      if (this.client && this.client.connected) {
        await this.client.disconnect();
        this.client = null;
      }

      // Create a new client instance for 2FA
      const stringSession = new StringSession('');
      const client = new TelegramClient(
        stringSession,
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 5,
        }
      );

      await client.connect();

      // Complete the sign-in with password
      await client.start({
        phoneNumber: async () => phoneNumber,
        phoneCode: async () => phoneCode,
        password: async () => password,
        onError: (err) => {
          console.error('Authentication error:', err);
        },
      });

      // If we get here, authentication was successful
      const me = await client.getMe();
      const sessionString = client.session.save() as unknown as string;

      const user: TelegramUser = {
        id: me.id.toJSNumber(),
        firstName: me.firstName || '',
        lastName: me.lastName,
        username: me.username,
        phoneNumber: phoneNumber,
      };

      // Update the main client
      this.client = client;

      // Save session
      await this.saveSession(sessionString, user);

      return { success: true, sessionString, user };
    } catch (error: any) {
      console.error('Password verification failed:', error);
      
      // Handle flood wait error
      if (error.message && error.message.includes('FLOOD')) {
        const waitTime = error.seconds || 0;
        this.setFloodWait(waitTime);
        return { 
          success: false, 
          error: `Too many requests. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`
        };
      }
      
      return { success: false, error: error.message || 'Password verification failed' };
    } finally {
      this.isAuthenticating = false;
    }
  }

  async getCurrentUser(): Promise<TelegramUser | null> {
    if (!this.client || !this.client.connected) {
      return null;
    }

    try {
      const me = await this.client.getMe();
      return {
        id: me.id.toJSNumber(),
        firstName: me.firstName || '',
        lastName: me.lastName,
        username: me.username,
        phoneNumber: '', // Phone number not available in getMe
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async getChats(): Promise<TelegramChat[]> {
    console.log('getChats called');
    console.log('Client exists:', !!this.client);
    
    if (!this.client) {
      console.error('Telegram client not initialized');
      return [];
    }

    console.log('Client connected:', this.client.connected);
    if (!this.client.connected) {
      console.error('Telegram client not connected');
      return [];
    }

    try {
      const dialogs = await this.client.getDialogs();
      const chats: TelegramChat[] = [];

      for (const dialog of dialogs) {
        if (dialog.entity && (dialog.isChannel || dialog.isGroup)) {
          const entity = dialog.entity as any;
          
          // Get chat photo if available
          let photoUrl = null;
          if (entity.photo && entity.photo.photoId) {
            try {
              // Try to get the actual photo from Telegram
              const photo = await this.client.downloadProfilePhoto(entity);
              if (photo) {
                // Convert buffer to base64 data URL
                const base64 = Buffer.from(photo).toString('base64');
                photoUrl = `data:image/jpeg;base64,${base64}`;
              }
            } catch (error) {
              console.log('Could not download photo for chat:', entity.id.toJSNumber());
              // Fallback to a placeholder or null
              photoUrl = null;
            }
          }

          const chat: TelegramChat = {
            id: entity.id.toJSNumber(),
            title: dialog.title || 'Unknown',
            type: dialog.isChannel ? 'channel' : dialog.isGroup ? 'group' : 'supergroup',
            username: entity.username,
            participantsCount: entity.participantsCount,
            description: entity.about || entity.description || '',
            photo: photoUrl || undefined,
            isPrivate: entity.megagroup || entity.gigagroup || false,
            isVerified: entity.verified || false,
            isScam: entity.scam || false,
            isRestricted: entity.restricted || false,
            accessHash: entity.accessHash ? entity.accessHash.toString() : null,
            inviteLink: entity.inviteLink || null,
          };
          chats.push(chat);
        }
      }

      return chats;
    } catch (error) {
      console.error('Failed to get chats:', error);
      return [];
    }
  }

  async sendMessage(chatId: number, message: string): Promise<boolean> {
    if (!this.client) {
      console.error('Telegram client not initialized');
      return false;
    }

    if (!this.client.connected) {
      console.error('Telegram client not connected');
      return false;
    }

    try {
      console.log('Sending message to chat ID:', chatId);
      console.log('Message content:', message);
      
      // Try different approaches to send message
      let result;
      
      try {
        // First try: Direct chat ID
        result = await this.client.sendMessage(chatId, { message });
      } catch (error1) {
        console.log('Direct chat ID failed, trying with InputPeerUser...');
        try {
          // Second try: InputPeerUser
          const { InputPeerUser } = await import('telegram');
          const peer = new InputPeerUser({ userId: chatId, accessHash: 0n });
          result = await this.client.sendMessage(peer, { message });
        } catch (error2) {
          console.log('InputPeerUser failed, trying to find in dialogs...');
          // Third try: Find in dialogs
          const dialogs = await this.client.getDialogs();
          const dialog = dialogs.find(d => d.id.toString() === chatId.toString());
          if (dialog) {
            result = await this.client.sendMessage(dialog.entity, { message });
          } else {
            throw new Error('Chat not found in dialogs');
          }
        }
      }
      
      console.log('Message sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Chat ID:', chatId);
      console.error('Message:', message);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.client.connected) {
      await this.client.disconnect();
    }
  }

  isConnected(): boolean {
    return this.client ? (this.client.connected || false) : false;
  }
}

export const telegramService = new TelegramService();
