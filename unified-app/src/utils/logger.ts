// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

// Log entry structure
export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  action: string
  message: string
  fields?: Record<string, any>
}

// Logger class
class Logger {
  private level: LogLevel

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARNING]: 2,
      [LogLevel.ERROR]: 3
    }
    
    return levels[level] >= levels[this.level]
  }

  private log(level: LogLevel, component: string, action: string, message: string, fields?: Record<string, any>) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      action,
      message,
      fields
    }

    // Format for console
    const prefix = `[${level}] ${component}:${action}`
    const logMessage = `${prefix} - ${message}`

    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage)
        break
      case LogLevel.INFO:
        console.info(logMessage)
        break
      case LogLevel.WARNING:
        console.warn(logMessage)
        break
      case LogLevel.ERROR:
        console.error(logMessage)
        break
    }

    // In production, you might want to send logs to a service
    if (process.env.NODE_ENV === 'production' && level === LogLevel.ERROR) {
      this.sendToLogService(entry)
    }
  }

  private sendToLogService(entry: LogEntry) {
    // TODO: Implement sending logs to external service
    // For now, just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
      logs.push(entry)
      if (logs.length > 100) logs.shift() // Keep only last 100 logs
      localStorage.setItem('app_logs', JSON.stringify(logs))
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  debug(component: string, action: string, message: string, fields?: Record<string, any>) {
    this.log(LogLevel.DEBUG, component, action, message, fields)
  }

  info(component: string, action: string, message: string, fields?: Record<string, any>) {
    this.log(LogLevel.INFO, component, action, message, fields)
  }

  warning(component: string, action: string, message: string, fields?: Record<string, any>) {
    this.log(LogLevel.WARNING, component, action, message, fields)
  }

  error(component: string, action: string, message: string, fields?: Record<string, any>) {
    this.log(LogLevel.ERROR, component, action, message, fields)
  }

  // Set log level
  setLevel(level: LogLevel) {
    this.level = level
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.level
  }
}

// Create default logger instance
const logger = new Logger()

// Export both the class and the instance
export { Logger }
export default logger
