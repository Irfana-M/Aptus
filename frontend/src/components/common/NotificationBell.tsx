
import React, { useEffect, useState } from "react";
import { Bell, Check, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserNotifications, markNotificationAsRead, type UserNotification } from "../../api/userApi";
import socketService from "../../services/socketService";


export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotifications();
      const list = res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Connect to socket and listen for live notifications
    const socket = socketService.connect();
    
    socket.on('notification', (newNotification: UserNotification) => {
      console.log('🔔 New real-time notification reçu:', newNotification);
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    const interval = setInterval(fetchNotifications, 60000); // Reduce polling to 1 min since we have sockets
    
    return () => {
      socket.off('notification');
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent | null, id: string) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleNotificationClick = (n: UserNotification) => {
    if (!n.isRead) {
        handleMarkAsRead(null, n._id);
    }
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-full relative transition-colors group"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:text-[rgb(73,187,189)] transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden origin-top-right transition-all">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                    <Bell size={24} className="mb-2 text-slate-300" />
                    No notifications yet
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div 
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${
                      !n.isRead ? 'bg-cyan-50/20' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <Clock size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-400">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        {!n.isRead && (
                            <button
                                onClick={(e) => handleMarkAsRead(e, n._id)}
                                className="text-slate-300 hover:text-cyan-600 p-1 rounded-full hover:bg-white transition-all shrink-0"
                                title="Mark as read"
                            >
                                <Check size={14} />
                            </button>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button 
                    onClick={() => {
                        setIsOpen(false);
                        navigate('/notifications'); 
                    }}
                    className="w-full py-2 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                >
                    View All Notifications
                </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
