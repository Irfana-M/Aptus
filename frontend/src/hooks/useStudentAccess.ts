import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { AccessState, resolveAccessState, ACCESS_STATE_HIERARCHY, getRecommendedRedirect } from '../utils/accessControl';

export const useStudentAccess = () => {
  const user = useSelector(selectCurrentUser);
  
  const currentAccessState = useMemo(() => resolveAccessState(user), [user]);

  const canAccess = (requiredState: AccessState) => {
    return ACCESS_STATE_HIERARCHY[currentAccessState] >= ACCESS_STATE_HIERARCHY[requiredState];
  };

  return {
    accessState: currentAccessState,
    canAccess,
    redirectUrl: getRecommendedRedirect(currentAccessState),
    isFullyQualified: currentAccessState === AccessState.FULLY_QUALIFIED,
    user
  };
};
