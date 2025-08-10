const isDevelopment = process.env.NODE_ENV === 'development';
const enableLogging = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true';
const logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || 'debug';

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

class Logger {
    private static instance: Logger;
    private isEnabled: boolean;
    private currentLogLevel: number;

    private constructor() {
        this.isEnabled = isDevelopment && enableLogging;
        this.currentLogLevel = LOG_LEVELS[logLevel] || LOG_LEVELS.debug;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public enable(): void {
        this.isEnabled = true;
    }

    public disable(): void {
        this.isEnabled = false;
    }

    private shouldLog(level: number): boolean {
        return this.isEnabled && level >= this.currentLogLevel;
    }

    public log(...args: any[]): void {
        if (this.shouldLog(LOG_LEVELS.debug)) {
            console.log(...args);
        }
    }

    public error(...args: any[]): void {
        if (this.shouldLog(LOG_LEVELS.error)) {
            console.error(...args);
        }
    }

    public warn(...args: any[]): void {
        if (this.shouldLog(LOG_LEVELS.warn)) {
            console.warn(...args);
        }
    }

    public info(...args: any[]): void {
        if (this.shouldLog(LOG_LEVELS.info)) {
            console.info(...args);
        }
    }

    public debug(...args: any[]): void {
        if (this.shouldLog(LOG_LEVELS.debug)) {
            console.debug(...args);
        }
    }
}

export const logger = Logger.getInstance(); 