import type { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '@/types';
import type { IUserRoleService } from '@/interfaces/services/IUserRoleSrvice';
import { 
  verifyAccessToken, 
  type CustomJwtPayload 
} from '../utils/jwt.util'; 
import { logger } from '@/utils/logger';
import type { MentorResponseDto } from '@/dto/mentor/MentorResponseDTO';
import type { StudentBaseResponseDto } from '@/dto/auth/UserResponseDTO';

@injectable()
export class RoleController {
  constructor(
    @inject(TYPES.IUserRoleService) 
    private userRoleService: IUserRoleService
  ) {}

 
public verifyRole = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('🔍 [ROLE CONTROLLER] verifyRole endpoint called');
    
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        error: 'No token provided. Format: Bearer <token>' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
      return;
    }

    logger.info(`[ROLE CONTROLLER] Token received: ${token.substring(0, 20)}...`);

    try {
      
      const decoded = verifyAccessToken(token);
      
      logger.info(`[ROLE CONTROLLER] Token decoded for user: ${decoded.email} (${decoded.role})`);

      
      if (decoded.role !== 'mentor' && decoded.role !== 'student') {
        res.status(403).json({ 
          success: false, 
          error: 'Invalid user role. Must be mentor or student.' 
        });
        return;
      }

      
      const userVerification = await this.userRoleService.verifyUserRole(
        decoded.id,
        decoded.role
      );
      
      if (!userVerification.success || !userVerification.user) {
        logger.warn(`[ROLE CONTROLLER] User not found in database: ${decoded.id}`);
        res.status(404).json({ 
          success: false, 
          error: userVerification.error || 'User not found in database' 
        });
        return;
      }

      
      const user = userVerification.user;
      
      
      if (decoded.role === 'mentor') {
        const mentorDetails = user as MentorResponseDto;
        res.json({
          success: true,
          user: {
            id: mentorDetails.id,
            email: mentorDetails.email,
            role: 'mentor',
            fullName: mentorDetails.fullName,
            phoneNumber: mentorDetails.phoneNumber,
            approvalStatus: mentorDetails.approvalStatus,
            isProfileComplete: mentorDetails.isProfileComplete,
          },
          tokenInfo: {
            issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
            expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
          },
          verifiedAt: new Date().toISOString()
        });
      } else {
        const studentDetails = user as StudentBaseResponseDto;
        res.json({
          success: true,
          user: {
            id: studentDetails.id,
            email: studentDetails.email,
            role: 'student',
            fullName: studentDetails.fullName,
            phoneNumber: studentDetails.phoneNumber,
            isPaid: studentDetails.isPaid,
          },
          tokenInfo: {
            issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
            expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
          },
          verifiedAt: new Date().toISOString()
        });
      }

      logger.info(`✅ [ROLE CONTROLLER] Role verified for: ${user.email}`);

    } catch (jwtError: any) {
      
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ 
          success: false, 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
      return;
    }

  } catch (error: any) {
    logger.error('[ROLE CONTROLLER] Error in verifyRole:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};
  
  public getUserInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, role } = req.params;
      
     
      if (!userId || !role) {
        res.status(400).json({ 
          success: false, 
          error: 'Missing parameters: userId and role are required' 
        });
        return;
      }

      if (!['mentor', 'student'].includes(role)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid role. Must be "mentor" or "student"' 
        });
        return;
      }

      logger.info(`[ROLE CONTROLLER] getUserInfo called for: ${userId} (${role})`);

      
      const userRole = role as 'mentor' | 'student';

     
      const userVerification = await this.userRoleService.verifyUserRole(
        userId,
        userRole
      );
      
      if (!userVerification.success) {
        logger.warn(`[ROLE CONTROLLER] User not found: ${userId} as ${role}`);
        res.status(404).json({ 
          success: false, 
          error: userVerification.error || 'User not found' 
        });
        return;
      }

      
      const user = await this.userRoleService.getUserByIdAndRole(
        userId,
        userRole
      );

      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User details not found' 
        });
        return;
      }

      
      const publicInfo: any = {
        id: user.id?.toString() || user.id,
        email: user.email,
        role: role,
        fullName: user.fullName || user.fullName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

   
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          if (!token) throw new Error('No token');
          
          const decoded = verifyAccessToken(token);
          
          
        } catch (error) {
         
          logger.debug('Token verification failed for additional info');
        }
      }

      res.json({
        success: true,
        user: publicInfo,
        timestamp: new Date().toISOString()
      });

      logger.info(`[ROLE CONTROLLER] User info returned for: ${userId}`);

    } catch (error: any) {
      logger.error('[ROLE CONTROLLER] Error in getUserInfo:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };

  
  public verifyTrialClassAccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trialClassId } = req.params;
      const authHeader = req.headers.authorization;
      
      
      if (!trialClassId) {
        res.status(400).json({ 
          success: false, 
          error: 'Missing trialClassId parameter' 
        });
        return;
      }
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
          success: false, 
          error: 'No token provided' 
        });
        return;
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        res.status(401).json({ 
          success: false, 
          error: 'No token provided' 
        });
        return;
      }
      
      try {
        
        const decoded = verifyAccessToken(token);
        
       
        if (decoded.role !== 'mentor' && decoded.role !== 'student') {
          res.status(403).json({ 
            success: false, 
            authorized: false,
            error: 'Invalid user role. Must be mentor or student.',
            user: {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role
            }
          });
          return;
        }

  
        const authCheck = await this.userRoleService.verifyTrialClassAuthorization(
          trialClassId,
          decoded.id,
          decoded.role
        );

        if (!authCheck.authorized) {
          res.status(403).json({ 
            success: false, 
            authorized: false,
            error: authCheck.error,
            user: {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role
            }
          });
          return;
        }

        // Return authorization info
        res.json({
          success: true,
          authorized: true,
          user: {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
          },
          trialClass: {
            id: authCheck.trialClass?._id?.toString(),
            status: authCheck.trialClass?.status,
            studentId: authCheck.trialClass?.student?.toString(),
            mentorId: authCheck.trialClass?.mentor?.toString(),
            preferredDate: authCheck.trialClass?.preferredDate,
            meetLink: authCheck.trialClass?.meetLink
          },
          verifiedAt: new Date().toISOString()
        });

      } catch (jwtError: any) {
        
        if (jwtError.name === 'TokenExpiredError') {
          res.status(401).json({ 
            success: false, 
            error: 'Token expired' 
          });
        } else {
          res.status(401).json({ 
            success: false, 
            error: 'Invalid token' 
          });
        }
        return;
      }

    } catch (error: any) {
      logger.error('[ROLE CONTROLLER] Error in verifyTrialClassAccess:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };

  
  public getUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
          success: false, 
          error: 'No token provided' 
        });
        return;
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        res.status(401).json({ 
          success: false, 
          error: 'No token provided' 
        });
        return;
      }
      
      try {
        
        const decoded = verifyAccessToken(token);
        
        res.json({
          success: true,
          role: decoded.role,
          userId: decoded.id,
          email: decoded.email
        });
      } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
          res.status(401).json({ 
            success: false, 
            error: 'Token expired' 
          });
        } else {
          res.status(401).json({ 
            success: false, 
            error: 'Invalid token' 
          });
        }
      }

    } catch (error) {
      logger.error('[ROLE CONTROLLER] Error in getUserRole:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };

  
  public checkUserExists = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ 
          success: false, 
          error: 'Missing userId parameter' 
        });
        return;
      }

      const existsCheck = await this.userRoleService.userExists(userId);
      
      res.json({
        success: true,
        exists: existsCheck.exists,
        role: existsCheck.role,
        email: existsCheck.email
      });

    } catch (error) {
      logger.error('[ROLE CONTROLLER] Error in checkUserExists:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };


  public getUserRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing userId parameter' 
      });
      return;
    }

   
    const existsCheck = await this.userRoleService.userExists(userId);
    
    if (!existsCheck.exists) {
      res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
      return;
    }

    res.json({
      success: true,
      userId,
      role: existsCheck.role,
      email: existsCheck.email
    });

  } catch (error: any) {
    logger.error('[ROLE CONTROLLER] Error in getUserRoleById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
}