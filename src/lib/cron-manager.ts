// Client-side cron manager using browser APIs

export interface ScheduledMessage {
  id: string;
  chatId: number;
  message: string;
  cronExpression: string;
  isActive: boolean;
  createdAt: string;
  lastSent?: string;
}

export interface CronJob {
  id: string;
  intervalId: number;
  scheduledMessage: ScheduledMessage;
}

class CronManager {
  private jobs: Map<string, CronJob> = new Map();
  private storageKey = 'telegram_scheduled_messages';

  constructor() {
    this.loadScheduledMessages();
  }

  private loadScheduledMessages(): void {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const scheduledMessages: ScheduledMessage[] = JSON.parse(data);
          
          scheduledMessages.forEach(message => {
            if (message.isActive) {
              this.scheduleMessage(message);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load scheduled messages:', error);
    }
  }

  private saveScheduledMessages(): void {
    try {
      if (typeof window !== 'undefined') {
        const scheduledMessages = Array.from(this.jobs.values()).map(job => job.scheduledMessage);
        localStorage.setItem(this.storageKey, JSON.stringify(scheduledMessages, null, 2));
      }
    } catch (error) {
      console.error('Failed to save scheduled messages:', error);
    }
  }

  private parseCronExpression(cronExpression: string): { interval: number; unit: 'minutes' | 'hours' | 'days' | 'daily' } | null {
    // Simple cron parser for common patterns
    const parts = cronExpression.split(' ');
    
    if (parts.length === 5) {
      const minute = parts[0];
      const hour = parts[1];
      const day = parts[2];
      const month = parts[3];
      const dayOfWeek = parts[4];

      // Handle simple patterns
      if (minute === '*' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        return { interval: 1, unit: 'minutes' };
      }
      
      if (minute !== '*' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        return { interval: parseInt(minute) || 1, unit: 'minutes' };
      }
      
      if (minute === '0' && hour !== '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        return { interval: parseInt(hour) || 1, unit: 'hours' };
      }
      
      if (minute === '0' && hour === '0' && day !== '*' && month === '*' && dayOfWeek === '*') {
        return { interval: parseInt(day) || 1, unit: 'days' };
      }

      // Handle daily at specific time (e.g., "47 02 * * *" = daily at 02:47)
      if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        return { interval: 1, unit: 'daily' };
      }
    }
    
    return null;
  }

  private getIntervalMs(interval: number, unit: 'minutes' | 'hours' | 'days' | 'daily'): number {
    switch (unit) {
      case 'minutes':
        return interval * 60 * 1000;
      case 'hours':
        return interval * 60 * 60 * 1000;
      case 'days':
        return interval * 24 * 60 * 60 * 1000;
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      default:
        return 60 * 1000; // Default to 1 minute
    }
  }

  private async sendScheduledMessage(scheduledMessage: ScheduledMessage): Promise<void> {
    try {
      // Get API credentials from localStorage
      const config = localStorage.getItem('telegram_config');
      const sessionString = localStorage.getItem('telegram_session');
      
      if (!config || !sessionString) {
        console.error('Configuration or session not found for cron job');
        console.error('Config exists:', !!config);
        console.error('Session exists:', !!sessionString);
        console.error('Available localStorage keys:', Object.keys(localStorage));
        return;
      }

      let apiId, apiHash;
      try {
        const parsedConfig = JSON.parse(config);
        apiId = parsedConfig.apiId;
        apiHash = parsedConfig.apiHash;
      } catch (error) {
        console.error('Failed to parse config:', error);
        return;
      }

      if (!apiId || !apiHash) {
        console.error('API credentials missing from config');
        console.error('API ID:', apiId);
        console.error('API Hash:', apiHash ? '***' : 'missing');
        return;
      }

      console.log('Cron job - API ID:', apiId);
      console.log('Cron job - Session string length:', sessionString.length);

      const response = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-string': sessionString,
          'x-api-id': apiId,
          'x-api-hash': apiHash,
        },
        body: JSON.stringify({
          chatId: scheduledMessage.chatId,
          message: scheduledMessage.message,
        }),
      });

      if (response.ok) {
        // Update last sent time
        scheduledMessage.lastSent = new Date().toISOString();
        this.saveScheduledMessages();
        console.log('Scheduled message sent successfully');
      } else {
        const errorText = await response.text();
        console.error('Failed to send scheduled message:', errorText);
        console.error('Response status:', response.status);
        console.error('Chat ID:', scheduledMessage.chatId);
        console.error('Message:', scheduledMessage.message);
      }
    } catch (error) {
      console.error('Failed to send scheduled message:', error);
    }
  }

  scheduleMessage(scheduledMessage: ScheduledMessage): boolean {
    try {
      // Parse cron expression
      const parsed = this.parseCronExpression(scheduledMessage.cronExpression);
      if (!parsed) {
        console.error('Unsupported cron expression:', scheduledMessage.cronExpression);
        return false;
      }

      // Stop existing job if it exists
      if (this.jobs.has(scheduledMessage.id)) {
        this.stopMessage(scheduledMessage.id);
      }

      // Create interval based on type
      let intervalId: number;
      
      if (parsed.unit === 'daily') {
        // For daily messages, check every minute if it's time to send
        intervalId = window.setInterval(async () => {
          const now = new Date();
          const parts = scheduledMessage.cronExpression.split(' ');
          const targetMinute = parseInt(parts[0]);
          const targetHour = parseInt(parts[1]);
          
          // Check if current time matches target time
          if (now.getMinutes() === targetMinute && now.getHours() === targetHour) {
            // Check if we already sent today
            const today = now.toDateString();
            const lastSentDate = scheduledMessage.lastSent ? new Date(scheduledMessage.lastSent).toDateString() : null;
            
            if (lastSentDate !== today) {
              await this.sendScheduledMessage(scheduledMessage);
            }
          }
        }, 60000); // Check every minute
      } else {
        // For other types, use regular interval
        const intervalMs = this.getIntervalMs(parsed.interval, parsed.unit);
        intervalId = window.setInterval(async () => {
          await this.sendScheduledMessage(scheduledMessage);
        }, intervalMs);
      }

      const job: CronJob = {
        id: scheduledMessage.id,
        intervalId,
        scheduledMessage
      };

      this.jobs.set(scheduledMessage.id, job);
      this.saveScheduledMessages();
      return true;
    } catch (error) {
      console.error('Failed to schedule message:', error);
      return false;
    }
  }

  stopMessage(messageId: string): boolean {
    try {
      const job = this.jobs.get(messageId);
      if (job) {
        clearInterval(job.intervalId);
        job.scheduledMessage.isActive = false;
        this.jobs.delete(messageId);
        this.saveScheduledMessages();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to stop message:', error);
      return false;
    }
  }

  startMessage(messageId: string): boolean {
    try {
      const job = this.jobs.get(messageId);
      if (job) {
        job.scheduledMessage.isActive = true;
        this.scheduleMessage(job.scheduledMessage);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start message:', error);
      return false;
    }
  }

  deleteMessage(messageId: string): boolean {
    try {
      const job = this.jobs.get(messageId);
      if (job) {
        clearInterval(job.intervalId);
        this.jobs.delete(messageId);
        this.saveScheduledMessages();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }

  getAllScheduledMessages(): ScheduledMessage[] {
    return Array.from(this.jobs.values()).map(job => job.scheduledMessage);
  }

  getScheduledMessage(messageId: string): ScheduledMessage | null {
    const job = this.jobs.get(messageId);
    return job ? job.scheduledMessage : null;
  }

  updateMessage(messageId: string, updates: Partial<ScheduledMessage>): boolean {
    try {
      const job = this.jobs.get(messageId);
      if (job) {
        // Update the scheduled message
        Object.assign(job.scheduledMessage, updates);
        
        // If cron expression changed, reschedule
        if (updates.cronExpression) {
          this.scheduleMessage(job.scheduledMessage);
        }
        
        this.saveScheduledMessages();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update message:', error);
      return false;
    }
  }
}

export const cronManager = new CronManager();