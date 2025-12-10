

// src/utils/videoCallPrep.ts
export const prepareForVideoCall = () => {
  console.log('🧹 PREPARING FOR VIDEO CALL...');
  
  // Get token from localStorage
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('❌ No access token found');
    return false;
  }
  
  try {
    // Decode token to get actual user data
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    console.log('👤 ACTUAL USER FROM TOKEN:', {
      email: payload.email,
      role: payload.role,
      id: payload.id || payload._id
    });
    
    // Force-correct localStorage
    localStorage.setItem('userRole', payload.role);
    localStorage.setItem('userId', payload.id || payload._id);
    
    console.log('✅ LocalStorage corrected:', {
      role: localStorage.getItem('userRole'),
      userId: localStorage.getItem('userId')
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to prepare for video call:', error);
    return false;
  }
};

