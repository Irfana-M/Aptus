
import React, { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserNotifications, markNotificationAsRead } from "../../api/userApi";

interface Notification {
  _id: string;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'read' | 'failed';
  createdAt: string;
  type: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotifications();
      // Ensure res.data is the array, or res is the array depending on API structure
      const list = Array.isArray(res) ? res : res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => n.status !== 'read').length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (n.status !== 'read') {
        markNotificationAsRead(n._id); // Mark read on click too
    }
    // Navigate based on type if needed
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-cyan-600 transition-all duration-200 group"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 ring-1 ring-black/5 z-50 overflow-hidden origin-top-right transition-all">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                    <Bell size={24} className="mb-2 text-gray-300" />
                    No notifications yet
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div 
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                      n.status !== 'read' ? 'bg-cyan-50/30' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                            <p className={`text-sm ${n.status !== 'read' ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5">
                                {new Date(n.createdAt).toLocaleString()}
                            </p>
                        </div>
                        {n.status !== 'read' && (
                            <button
                                onClick={(e) => handleMarkAsRead(e, n._id)}
                                className="text-gray-400 hover:text-cyan-600 p-1 rounded-full hover:bg-white transition-all"
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

            <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                <button 
                    onClick={() => {
                        setIsOpen(false);
                        // Determine route based on user role roughly or just go to generic page
                        navigate('/notifications'); 
                    }}
                    className="w-full py-2 text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
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
