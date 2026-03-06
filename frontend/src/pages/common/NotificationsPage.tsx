import React, { useEffect, useState } from "react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, type PaginationMeta } from "../../api/userApi";
import toast from "react-hot-toast";
import { Bell, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { type NotificationDTO, type NotificationUI, mapNotificationDTOToUI } from "../../types/notification.types";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { MentorLayout } from "../../components/mentor/MentorLayout";
import StudentLayout from "../../components/students/StudentLayout";
import { AdminLayout } from "../../components/admin/AdminLayout";

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const limit = 10;
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { admin } = useSelector((state: RootState) => state.admin);
  const role = user?.role || admin?.role;

const fetchNotifications = async (currentPage: number) => {
  try {
    setLoading(true);
    const res = await getUserNotifications(currentPage, limit);

    const rawList: NotificationDTO[] = Array.isArray(res.data)
      ? res.data as unknown as NotificationDTO[]
      : (res.data as any)?.items || [];

    const paginationData = (res.data as any)?.pagination || null;
    const list = rawList.map(mapNotificationDTOToUI);

    setNotifications(list);
    setPagination(paginationData);
  } catch (error) {
    console.error("Failed to fetch notifications", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
    } catch (error) {
        console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllRead = async () => {
     try {
         await markAllNotificationsAsRead();
         setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
         toast.success("All notifications marked as read.");
     } catch (error) {
         console.error("Failed to mark all as read", error);
         toast.error("Failed to update notification.");
     }
  };

  const content = (
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
            <div className="py-12">
                <Loader size="md" text="Loading notifications..." />
            </div>
        ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                <EmptyState 
                    title="No notifications"
                    description="You're all caught up!"
                    icon={Bell}
                />
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
  );

  if (role === 'mentor') {
    return <MentorLayout title="Notifications">{content}</MentorLayout>;
  }

  if (role === 'student') {
    return <StudentLayout title="Notifications">{content}</StudentLayout>;
  }

  if (role === 'admin') {
    return (
      <AdminLayout title="Notifications" activeItem="Notifications">
        {content}
      </AdminLayout>
    );
  }

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
       {content}
    </div>
  );
};

export default NotificationsPage;

