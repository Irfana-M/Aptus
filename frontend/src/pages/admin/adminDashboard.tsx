import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchDashboardData } from "../../features/admin/dashboardSlice";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { Loader } from "../../components/ui/Loader";

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "cyan",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "cyan" | "green" | "orange" | "purple" | "blue" | "red";
}) => {
  const colorClasses = {
    cyan: "from-cyan-500 to-teal-600",
    green: "from-green-500 to-emerald-600",
    orange: "from-orange-500 to-amber-600",
    purple: "from-purple-500 to-indigo-600",
    blue: "from-blue-500 to-cyan-600",
    red: "from-red-500 to-rose-600",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium flex items-center ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp size={14} className={trend.isPositive ? "" : "rotate-180"} />
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-gray-500 text-sm mt-2">{subtitle}</p>}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center shadow-md`}
        >
          <div className="text-white">{icon}</div>
        </div>
      </div>
    </div>
  );
};

const QuickStatsCard = ({ title, value, icon, color = "gray" }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "gray" | "green" | "red" | "yellow";
}) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    totalStudents,
    totalMentors,
    activeSessions,
    pendingApprovals,
    finance,
    loading,
    error,
  } = useSelector((state: RootState) => state.dashboard);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");

  useEffect(() => {
    dispatch(fetchDashboardData())
      .unwrap()
      .catch((err: unknown) => {
        console.error("❌ Failed to fetch dashboard data:", err);
      });
  }, [dispatch]);

  // Calculate current month's revenue
  const currentMonthRevenue = useMemo(() => {
    if (!finance?.monthlyRevenue || finance.monthlyRevenue.length === 0) return 0;
    // The backend sorts by year/month desc, so the first one is the most recent
    return finance.monthlyRevenue[0].amount;
  }, [finance]);

  const totalRevenue = finance?.totalRevenue || 0;
  const completionRate = 0;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isOpen={sidebarOpen}
          activeItem={activeNav}
          onItemClick={setActiveNav}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader size="lg" text="Loading dashboard..." color="teal" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isOpen={sidebarOpen}
          activeItem={activeNav}
          onItemClick={setActiveNav}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">Error loading dashboard</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Reusable Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        activeItem={activeNav}
        onItemClick={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Dashboard Overview"
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Admin!</h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your platform today.
            </p>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Students"
              value={totalStudents || 0}
              subtitle="Registered learners"
              icon={<Users size={24} />}
              color="cyan"
            />
            <StatCard
              title="Total Mentors"
              value={totalMentors || 0}
              subtitle="Expert educators"
              icon={<Users size={24} />}
              color="orange"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${totalRevenue.toLocaleString()}`}
              subtitle="All time revenue"
              icon={<DollarSign size={24} />}
              color="green"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₹${currentMonthRevenue.toLocaleString()}`}
              subtitle="Current month"
              icon={<TrendingUp size={24} />}
              color="purple"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <QuickStatsCard
              title="Pending Approvals"
              value={pendingApprovals}
              icon={<Clock size={20} />}
              color="yellow"
            />
            <QuickStatsCard
              title="Completion Rate"
              value={`${completionRate}%`}
              icon={<CheckCircle size={20} />}
              color="green"
            />
            <QuickStatsCard
              title="Active Sessions"
              value={activeSessions || 0}
              icon={<Users size={20} />}
              color="green"
            />
            <QuickStatsCard
              title="Issues Reported"
              value="0"
              icon={<XCircle size={20} />}
              color="red"
            />
          </div>


        </div>
      </main>
    </div>
  );
}
