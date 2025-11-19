import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchDashboardData } from "../../features/admin/dashboardSlice";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { Users, BookOpen, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

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
    loading,
    error,
  } = useSelector((state: RootState) => state.dashboard);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");

  useEffect(() => {
    dispatch(fetchDashboardData())
      .unwrap()
      .then((data) => {
        console.log("✅ Dashboard data:", data);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch dashboard data:", err);
      });
  }, [dispatch]);

  // Calculate additional stats (you can replace these with actual data from your API)
  const pendingApprovals = 5; // This should come from your API
  const activeCourses = 24;
  const monthlyRevenue = 12458;
  const completionRate = 78;

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
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
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
              trend={{ value: 12, isPositive: true }}
              color="cyan"
            />
            <StatCard
              title="Total Mentors"
              value={totalMentors || 0}
              subtitle="Expert educators"
              icon={<Users size={24} />}
              trend={{ value: 8, isPositive: true }}
              color="orange"
            />
            <StatCard
              title="Active Courses"
              value={activeCourses}
              subtitle="Running currently"
              icon={<BookOpen size={24} />}
              trend={{ value: 5, isPositive: true }}
              color="green"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${monthlyRevenue.toLocaleString()}`}
              subtitle="This month"
              icon={<DollarSign size={24} />}
              trend={{ value: 18, isPositive: true }}
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
              value="142"
              icon={<Users size={20} />}
              color="gray"
            />
            <QuickStatsCard
              title="Issues Reported"
              value="3"
              icon={<XCircle size={20} />}
              color="red"
            />
          </div>

          {/* Platform Overview */}
          {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Platform Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="text-blue-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900">User Growth</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {((totalStudents || 0) + (totalMentors || 0))} total users
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="text-green-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900">Learning Activity</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {activeCourses} active courses running
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900">Performance</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Platform running smoothly
                </p>
              </div>
            </div>
          </div> */}

          {/* Quick Actions */}
          {/* <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors duration-200 font-medium">
                Manage Students
              </button>
              <button className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium">
                Review Mentors
              </button>
              <button className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
                View Reports
              </button>
              <button className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium">
                System Settings
              </button>
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
}