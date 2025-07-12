import { writeTextFile, readTextFile, BaseDirectory, exists, create } from '@tauri-apps/plugin-fs';

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  details?: any;
}

class Logger {
  private logFile = 'athena-app.log';
  private maxLogSize = 1024 * 1024; // 1MB
  private maxLogEntries = 1000;

  private async ensureLogDirectory(): Promise<string> {
    try {
      const logDir = 'logs';
      const logDirExists = await exists(logDir, { baseDir: BaseDirectory.AppData });
      if (!logDirExists) {
        await create(logDir, { baseDir: BaseDirectory.AppData });
      }
      return logDir;
    } catch (error) {
      console.error('Failed to ensure log directory:', error);
      throw error;
    }
  }

  private async getLogFilePath(): Promise<string> {
    const logDir = await this.ensureLogDirectory();
    return `${logDir}/${this.logFile}`;
  }

  private async readExistingLogs(): Promise<LogEntry[]> {
    try {
      const logPath = await this.getLogFilePath();
      const logExists = await exists(logPath, { baseDir: BaseDirectory.AppData });
      
      if (!logExists) {
        return [];
      }

      const content = await readTextFile(logPath, { baseDir: BaseDirectory.AppData });
      if (!content.trim()) {
        return [];
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read existing logs:', error);
      return [];
    }
  }

  private async writeLogs(logs: LogEntry[]): Promise<void> {
    try {
      const logPath = await this.getLogFilePath();
      await writeTextFile(logPath, JSON.stringify(logs, null, 2), { baseDir: BaseDirectory.AppData });
    } catch (error) {
      console.error('Failed to write logs:', error);
      throw error;
    }
  }

  private async rotateLogsIfNeeded(logs: LogEntry[]): Promise<LogEntry[]> {
    // Check if we need to rotate based on size or entry count
    const logSize = JSON.stringify(logs).length;
    
    if (logSize > this.maxLogSize || logs.length > this.maxLogEntries) {
      // Keep only the most recent entries
      const keepCount = Math.floor(this.maxLogEntries * 0.7); // Keep 70% of max entries
      return logs.slice(-keepCount);
    }
    
    return logs;
  }

  async log(level: LogEntry['level'], message: string, details?: any): Promise<void> {
    try {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        details
      };

      // Always log to console for immediate visibility
      console.log(`[${entry.level}] ${entry.message}`, details || '');

      const existingLogs = await this.readExistingLogs();
      existingLogs.push(entry);
      
      const rotatedLogs = await this.rotateLogsIfNeeded(existingLogs);
      await this.writeLogs(rotatedLogs);
    } catch (error) {
      console.error('Failed to write log entry:', error);
    }
  }

  async info(message: string, details?: any): Promise<void> {
    await this.log('INFO', message, details);
  }

  async warn(message: string, details?: any): Promise<void> {
    await this.log('WARN', message, details);
  }

  async error(message: string, details?: any): Promise<void> {
    await this.log('ERROR', message, details);
  }

  async debug(message: string, details?: any): Promise<void> {
    await this.log('DEBUG', message, details);
  }

  async getLogs(): Promise<LogEntry[]> {
    return await this.readExistingLogs();
  }

  async clearLogs(): Promise<void> {
    try {
      const logPath = await this.getLogFilePath();
      await writeTextFile(logPath, '[]', { baseDir: BaseDirectory.AppData });
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }

  // Get logs as formatted string for easy reading
  async getLogsAsString(): Promise<string> {
    const logs = await this.getLogs();
    return logs.map(log => 
      `[${log.timestamp}] [${log.level}] ${log.message}${log.details ? ` - ${JSON.stringify(log.details)}` : ''}`
    ).join('\n');
  }

  // Export logs to a downloadable file
  async exportLogs(): Promise<void> {
    try {
      const logString = await this.getLogsAsString();
      const blob = new Blob([logString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `athena-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  }

  // Get the log file path for manual inspection
  async getLogFilePathForUser(): Promise<string> {
    try {
      const logPath = await this.getLogFilePath();
      return logPath;
    } catch (error) {
      console.error('Failed to get log file path:', error);
      return 'logs/athena-app.log'; // Fallback path
    }
  }
}

export const logger = new Logger(); 