import type { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '@/types';
import type { IUserRoleService } from '@/interfaces/services/IUserRoleSrvice';
import { 
  verifyAccessToken 
} from '../utils/jwt.util'; 
import { logger } from '@/utils/logger';
import type { MentorResponseDto } from '@/dtos/mentor/MentorResponseDTO';
import type { StudentBaseResponseDto } from '@/dtos/auth/UserResponseDTO';
import { MESSAGES } from '@/constants/messages.constants';
import { HttpStatusCode } from '@/constants/httpStatus';
import { UserRole } from '@/enums/user.enum';

@injectable()
export class RoleController {
  constructor(
    @inject(TYPES.IUserRoleService) 
    private _userRoleService: IUserRoleService
  ) {}

 
public verifyRole = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('🔍 [ROLE CONTROLLER] verifyRole endpoint called');
    
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ 
        success: false, 
        error: MESSAGES.AUTH.NO_TOKEN 
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ 
        success: false, 
        error: MESSAGES.AUTH.NO_TOKEN 
      });
      return;
    }

    logger.info(`[ROLE CONTROLLER] Token received: ${token.substring(0, 20)}...`);

    try {
      
      const decoded = verifyAccessToken(token);
      
      logger.info(`[ROLE CONTROLLER] Token decoded for user: ${decoded.email} (${decoded.role})`);

      
      if (decoded.role !== UserRole.MENTOR && decoded.role !== UserRole.STUDENT) {
        res.status(HttpStatusCode.FORBIDDEN).json({ 
          success: false, 
          error: MESSAGES.AUTH.INVALID_ROLE 
        });
        return;
      }

      
      const userVerification = await this._userRoleService.verifyUserRole(
        decoded.id,
        decoded.role
      );
      
      if (!userVerification.success || !userVerification.user) {
        logger.warn(`[ROLE CONTROLLER] User not found in database: ${decoded.id}`);
        res.status(HttpStatusCode.NOT_FOUND).json({ 
          success: false, 
          error: userVerification.error || MESSAGES.AUTH.USER_NOT_FOUND 
        });
        return;
      }

      
      const user = userVerification.user;
      
      
      if (decoded.role === UserRole.MENTOR) {
        const mentorDetails = user as MentorResponseDto;
        res.json({
          success: true,
          user: {
            id: mentorDetails.id,
            email: mentorDetails.email,
            role: UserRole.MENTOR,
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
            role: UserRole.STUDENT,
            fullName: studentDetails.fullName,
            phoneNumber: studentDetails.phoneNumber,
            isPaid: (studentDetails as unknown as { isPaid: boolean }).isPaid,
          },
          tokenInfo: {
            issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
            expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
          },
          verifiedAt: new Date().toISOString()
        });
      }

      logger.info(`✅ [ROLE CONTROLLER] Role verified for: ${user.email}`);

    } catch (error: unknown) {
      const jwtError = error as Error;
      
      if (jwtError.name === 'TokenExpiredError') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: MESSAGES.AUTH.TOKEN_EXPIRED,
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: MESSAGES.AUTH.INVALID_TOKEN,
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
      return;
    }

  } catch (error: unknown) {
    logger.error('[ROLE CONTROLLER] Error in verifyRole:', error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
      code: 'SERVER_ERROR'
    });
  }
};
  
  public getUserInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, role } = req.params;
      
     
      if (!userId || !role) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false, 
          error: MESSAGES.COMMON.REQUIRED_FIELDS(['userId', 'role']) 
        });
        return;
      }

      if (![UserRole.MENTOR, UserRole.STUDENT].includes(role as UserRole)) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false, 
          error: MESSAGES.AUTH.INVALID_ROLE 
        });
        return;
      }

      logger.info(`[ROLE CONTROLLER] getUserInfo called for: ${userId} (${role})`);

      
      const userRole = role as UserRole.MENTOR | UserRole.STUDENT;

     
      const userVerification = await this._userRoleService.verifyUserRole(
        userId,
        userRole
      );
      
      if (!userVerification.success) {
        logger.warn(`[ROLE CONTROLLER] User not found: ${userId} as ${role}`);
        res.status(HttpStatusCode.NOT_FOUND).json({ 
          success: false, 
          error: userVerification.error || MESSAGES.AUTH.USER_NOT_FOUND 
        });
        return;
      }

      
      const userData = await this._userRoleService.getUserByIdAndRole(
        userId,
        userRole
      );

      if (!userData) {
        res.status(HttpStatusCode.NOT_FOUND).json({ 
          success: false, 
          error: MESSAGES.AUTH.USER_NOT_FOUND 
        });
        return;
      }

      
      const publicProfileInfo = {
        id: userData.id?.toString() || userData.id,
        email: userData.email,
        role: role,
        fullName: userData.fullName,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

   
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          if (!token) throw new Error('No token');
          
          verifyAccessToken(token);
          
          
        } catch {
          logger.debug('Token verification failed for additional info');
        }
      }

      res.json({
        success: true,
        user: publicProfileInfo,
        timestamp: new Date().toISOString()
      });

      logger.info(`[ROLE CONTROLLER] User info returned for: ${userId}`);

    } catch (error: unknown) {
      logger.error('[ROLE CONTROLLER] Error in getUserInfo:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR 
      });
    }
  };

  
  public verifyTrialClassAccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trialClassId } = req.params;
      const authHeader = req.headers.authorization;
      
      
      if (!trialClassId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false, 
          error: MESSAGES.COMMON.ID_REQUIRED('trialClass') 
        });
        return;
      }
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: MESSAGES.AUTH.NO_TOKEN 
        });
        return;
      }

      const tokenValue = authHeader.split(' ')[1];
      if (!tokenValue) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: MESSAGES.AUTH.NO_TOKEN 
        });
        return;
      }
      
      try {
        
        const decoded = verifyAccessToken(tokenValue);
        
       
        if (decoded.role !== UserRole.MENTOR && decoded.role !== UserRole.STUDENT) {
          res.status(HttpStatusCode.FORBIDDEN).json({ 
            success: false, 
            authorized: false,
            error: MESSAGES.AUTH.INVALID_ROLE,
            user: {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role
            }
          });
          return;
        }

  
        const authCheck = await this._userRoleService.verifyTrialClassAuthorization(
          trialClassId,
          decoded.id,
          decoded.role
        );

        if (!authCheck.authorized) {
          res.status(HttpStatusCode.FORBIDDEN).json({ 
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
          trialClass: authCheck.trialClass,
          verifiedAt: new Date().toISOString()
        });

      } catch (error: unknown) {
        const jwtError = error as Error;
        
        if (jwtError.name === 'TokenExpiredError') {
          res.status(HttpStatusCode.UNAUTHORIZED).json({ 
            success: false, 
            error: MESSAGES.AUTH.TOKEN_EXPIRED 
          });
        } else {
          res.status(HttpStatusCode.UNAUTHORIZED).json({ 
            success: false, 
            error: MESSAGES.AUTH.INVALID_TOKEN 
          });
        }
        return;
      }

    } catch (error: unknown) {
      logger.error('[ROLE CONTROLLER] Error in verifyTrialClassAccess:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR 
      });
    }
  };

  
  public getUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: MESSAGES.AUTH.NO_TOKEN 
        });
        return;
      }

      const authToken = authHeader.split(' ')[1];
      if (!authToken) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: MESSAGES.AUTH.NO_TOKEN 
        });
        return;
      }
      
      try {
        
        const decoded = verifyAccessToken(authToken);
        
        res.json({
          success: true,
          role: decoded.role,
          userId: decoded.id,
          email: decoded.email
        });
      } catch (error: unknown) {
        const err = error as Error;
        if (err.name === 'TokenExpiredError') {
          res.status(HttpStatusCode.UNAUTHORIZED).json({ 
            success: false, 
            error: MESSAGES.AUTH.TOKEN_EXPIRED 
          });
        } else {
          res.status(HttpStatusCode.UNAUTHORIZED).json({ 
            success: false, 
            error: MESSAGES.AUTH.INVALID_TOKEN 
          });
        }
      }

    } catch (error) {
      logger.error('[ROLE CONTROLLER] Error in getUserRole:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR 
      });
    }
  };

  
  public checkUserExists = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false, 
          error: MESSAGES.COMMON.ID_REQUIRED('user') 
        });
        return;
      }

      const existsCheck = await this._userRoleService.userExists(userId);
      
      res.json({
        success: true,
        exists: existsCheck.exists,
        role: existsCheck.role,
        email: existsCheck.email
      });

    } catch (error) {
      logger.error('[ROLE CONTROLLER] Error in checkUserExists:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR 
      });
    }
  };


  public getUserRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ 
        success: false, 
        error: MESSAGES.COMMON.ID_REQUIRED('user') 
      });
      return;
    }

   
    const existsCheck = await this._userRoleService.userExists(userId);
    
    if (!existsCheck.exists) {
      res.status(HttpStatusCode.NOT_FOUND).json({ 
        success: false, 
        error: MESSAGES.AUTH.USER_NOT_FOUND 
      });
      return;
    }

    res.json({
      success: true,
      userId,
      role: existsCheck.role,
      email: existsCheck.email
    });

  } catch (error: unknown) {
    logger.error('[ROLE CONTROLLER] Error in getUserRoleById:', error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR 
    });
  }
};
}