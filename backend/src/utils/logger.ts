import SystemLog, { ISystemLog } from '../models/systemLogModel';
import { Request } from 'express';

export interface LogData {
  action: string;
  category: 'auth' | 'course' | 'user' | 'system' | 'admin' | 'quiz' | 'recommendation';
  details: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  requestId?: string;
}

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async saveToDatabase(logData: LogData, req?: Request): Promise<void> {
    try {
      const logEntry = new SystemLog({
        ...logData,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        timestamp: new Date(),
        severity: logData.severity || 'info'
      });

      await logEntry.save();
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to save log to database:', error);
    }
  }

  private logToConsole(logData: LogData, req?: Request): void {
    const timestamp = new Date().toISOString();
    const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.get('User-Agent') || 'unknown';
    
    const logMessage = `[${timestamp}] [${logData.severity?.toUpperCase() || 'INFO'}] [${logData.category.toUpperCase()}] ${logData.action} - ${logData.details} | IP: ${ip} | User: ${logData.userEmail || 'anonymous'}`;
    
    switch (logData.severity) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warning':
        console.warn(logMessage);
        break;
      case 'success':
        console.log(`✅ ${logMessage}`);
        break;
      default:
        console.log(logMessage);
    }
  }

  public async log(logData: LogData, req?: Request): Promise<void> {
    // Log to console immediately
    this.logToConsole(logData, req);
    
    // Save to database asynchronously (don't wait for it)
    this.saveToDatabase(logData, req).catch(error => {
      console.error('Database logging failed:', error);
    });
  }

  public async info(action: string, details: string, category: LogData['category'], req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category,
      severity: 'info',
      metadata
    }, req);
  }

  public async success(action: string, details: string, category: LogData['category'], req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category,
      severity: 'success',
      metadata
    }, req);
  }

  public async warning(action: string, details: string, category: LogData['category'], req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category,
      severity: 'warning',
      metadata
    }, req);
  }

  public async error(action: string, details: string, category: LogData['category'], req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category,
      severity: 'error',
      metadata
    }, req);
  }

  public async auth(action: string, details: string, req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category: 'auth',
      severity: 'info',
      metadata
    }, req);
  }

  public async course(action: string, details: string, req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category: 'course',
      severity: 'info',
      metadata
    }, req);
  }

  public async user(action: string, details: string, req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category: 'user',
      severity: 'info',
      metadata
    }, req);
  }

  public async system(action: string, details: string, req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category: 'system',
      severity: 'info',
      metadata
    }, req);
  }

  public async admin(action: string, details: string, req?: Request, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      details,
      category: 'admin',
      severity: 'info',
      metadata
    }, req);
  }
}

export default Logger.getInstance(); 