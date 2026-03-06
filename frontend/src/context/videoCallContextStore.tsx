import React from 'react';
import type { VideoCallContextType } from '../types/video.types';

export const VideoCallContext = React.createContext<VideoCallContextType | undefined>(undefined);

export const useVideoCall = () => {
    const context = React.useContext(VideoCallContext);
    if (context === undefined) {
        throw new Error('useVideoCall must be used within a VideoCallProvider');
    }
    return context;
};

