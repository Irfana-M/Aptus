import React, { useEffect, useState } from "react";
import { getUserNotifications, markNotificationAsRead } from "../../api/userApi";
import { Bell, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {type  NotificationDTO,type NotificationUI, mapNotificationDTOToUI } from "../../types/notificationTypes";

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationUI[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

const fetchNotifications = async () => {
  try {
    setLoading(true);
    const res = await getUserNotifications();

    const rawList: NotificationDTO[] =
      Array.isArray(res) ? res : res.data || [];

    const list = rawList.map(mapNotificationDTOToUI);

    setNotifications(list);

  } catch (error) {
    console.error("Failed to fetch notifications", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
    } catch (error) {
        console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllRead = async () => {
     
     setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
     
     for (const n of notifications) {
         if (n.status !== 'read') await markNotificationAsRead(n._id);
     }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Use simple header or existing layout depending on context - simpler for now */}
       <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Bell className="text-cyan-600" /> Notifications
            </h1>
            <button 
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
                Back
            </button>
       </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-700">All Notifications</h2>
            {notifications.some(n => n.status !== 'read') && (
                <button 
                    onClick={handleMarkAllRead}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                    <CheckCircle size={16} /> Mark all as read
                </button>
            )}
        </div>

        {loading ? (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                <p className="mt-4 text-gray-500 text-sm">Loading notifications...</p>
            </div>
        ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="text-gray-300" size={32} />
                </div>
                <h3 className="text-gray-800 font-medium mb-1">No notifications</h3>
                <p className="text-gray-500 text-sm">You're all caught up!</p>
            </div>
        ) : (
            <div className="space-y-3">
                {notifications.map((n) => (
                    <div 
                        key={n._id}
                        className={`bg-white rounded-xl p-5 border transition-all duration-200 ${
                            n.status !== 'read' 
                                ? 'border-cyan-100 shadow-sm ring-1 ring-cyan-50' 
                                : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <h3 className={`text-base mb-1 ${n.status !== 'read' ? 'font-bold text-gray-800' : 'font-medium text-gray-700'}`}>
                                    {n.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                    {n.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(n.createdAt).toLocaleString()}
                                    </span>
                                    {n.type && (
                                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 capitalize">
                                            {n.type.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {n.status !== 'read' && (
                                <button
                                    onClick={() => handleMarkAsRead(n._id)}
                                    className="text-cyan-600 hover:bg-cyan-50 p-2 rounded-lg transition-colors group"
                                    title="Mark as read"
                                >
                                    <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
