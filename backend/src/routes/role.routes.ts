import { Router } from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types';

import type { RoleController } from '../controllers/role.controller';

import { verifyAccessToken } from '../utils/jwt.util';

const roleRoutes = Router();


const roleController = container.get<RoleController>(TYPES.RoleController);

roleRoutes.get('/verify', roleController.verifyRole);
roleRoutes.get('/role-only', roleController.getUserRole);
roleRoutes.get('/user/:userId/:role', roleController.getUserInfo);
roleRoutes.get('/verify-trial-class/:trialClassId', roleController.verifyTrialClassAccess);
roleRoutes.get('/exists/:userId', roleController.checkUserExists);
roleRoutes.get('/:userId', roleController.getUserRoleById);

roleRoutes.get('/debug', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      res.json({ success: true, tokenInfo: decoded, timestamp: new Date().toISOString() });
    } catch {
      res.json({ success: false, error: 'Invalid token' });
    }
  } else {
    res.json({ success: false, error: 'No token' });
  }
});

export default roleRoutes;