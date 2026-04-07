import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import type { ISessionAccessService, IJoinLinkTokenPayload } from '../../interfaces/services/ISessionAccessService';
import { logger } from '../../utils/logger';

@injectable()
export class SessionAccessService implements ISessionAccessService {
  private readonly _secret: string;
  private readonly _baseUrl: string;

  constructor() {
    this._secret = process.env.JWT_SECRET || 'fallback_secret';
    this._baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  }

  generateJoinLink(sessionId: string, userId: string, role: 'student' | 'mentor', _startTime: Date): string {

    const payload: IJoinLinkTokenPayload = {
      sessionId,
      userId,
      role
    };

    const token = jwt.sign(payload, this._secret, { expiresIn: '2h' }); // Simplified expiration for now, can be exact if needed
    
    return `${this._baseUrl}/classroom/${token}`;
  }

  verifyJoinLink(token: string): IJoinLinkTokenPayload | null {
    try {
      return jwt.verify(token, this._secret) as IJoinLinkTokenPayload;
    } catch (error) {
      logger.error('Invalid join link token:', error);
      return null;
    }
  }
}
