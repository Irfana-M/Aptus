

// src/utils/videoCallPrep.ts
export const prepareForVideoCall = (expectedRole?: string) => {
  console.log('🧹 PREPARING FOR VIDEO CALL...', expectedRole ? `(Expecting: ${expectedRole})` : '');
  
  // Search for the best token
  let token = null;
  let sourceKey = '';

  if (expectedRole) {
      token = localStorage.getItem(`${expectedRole}_accessToken`);
      sourceKey = `${expectedRole}_accessToken`;
  }
  
  if (!token) {
      const studentToken = localStorage.getItem('student_accessToken');
      const mentorToken = localStorage.getItem('mentor_accessToken');
      const genericToken = localStorage.getItem('accessToken');
      
      token = studentToken || mentorToken || genericToken;
      sourceKey = studentToken ? 'student_accessToken' : (mentorToken ? 'mentor_accessToken' : 'accessToken');
  }
  
  if (!token) {
    console.error('❌ No access token found (checked generic and role-specific keys)');
    return false;
  }
  
  try {
    // Decode token to get actual user data
    const payload = JSON.parse(atob(token.split('.')[1]));
    const actualRole = payload.role;
    const userId = payload.id || payload._id;

    console.log('👤 ACTUAL USER FROM TOKEN:', {
      email: payload.email,
      role: actualRole,
      id: userId,
      foundVia: sourceKey
    });

    // SELF-HEALING: If token was found under the wrong key or generic key, rectify it
    const roleKey = `${actualRole}_accessToken`;
    if (localStorage.getItem(roleKey) !== token) {
        console.log(`🩹 Rectifying token key: Saving to ${roleKey}`);
        localStorage.setItem(roleKey, token);
    }
    
    // Always sync shared keys
    localStorage.setItem('userRole', actualRole);
    localStorage.setItem('userId', userId);
    
    console.log('✅ LocalStorage synchronized:', {
      role: actualRole,
      id: userId,
      verifiedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to prepare for video call:', error);
    return false;
  }
};

