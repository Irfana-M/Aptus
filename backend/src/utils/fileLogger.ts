
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'debug_video.log');

export const fileLogger = (message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};
