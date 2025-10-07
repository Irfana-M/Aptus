import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchDashboardData } from "../../features/admin/dashboardSlice";
import {
  Menu,
  X,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Bell,
  Search,
  MessageSquare,
  HelpCircle,
  LogOut,
} from "lucide-react";

// ===== StatCard Component =====
const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}-600`}
      >
        {icon}
      </div>
    </div>
  </div>
);

// ===== Dashboard Page =====
export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    totalStudents,
    totalMentors,
    recentStudents,
    recentMentors,
    loading,
    error,
  } = useSelector((state: RootState) => state.dashboard);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  const links = [
    { icon: <Users size={20} />, label: "Dashboard" },
    { icon: <Users size={20} />, label: "Students" },
    { icon: <Users size={20} />, label: "Mentors" },
    { icon: <BookOpen size={20} />, label: "Courses" },
    { icon: <DollarSign size={20} />, label: "Finance" },
    { icon: <Calendar size={20} />, label: "Statistics" },
    { icon: <MessageSquare size={20} />, label: "Reports" },
    { icon: <HelpCircle size={20} />, label: "Feedback & Support" },
    { icon: <Bell size={20} />, label: "Notification" },
    { icon: <LogOut size={20} />, label: "Logout" },
  ];

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out`}
        style={{ background: "linear-gradient(to bottom, #49BBBD, #2C7A7B)" }}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#49BBBD" }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Mentora</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {links.map((item) => (
            <a
              key={item.label}
              href="#"
              onClick={() => setActive(item.label)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition text-white"
              style={{
                backgroundColor:
                  active === item.label ? "#187c80ff" : "#49BBBD",
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search here..."
                  className="pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <button className="relative p-2 bg-gray-700 rounded-lg">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-cyan-500 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* ===== Stats Cards ===== */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Students"
              value={totalStudents}
              icon={<Users size={24} />}
              color="purple"
            />
            <StatCard
              title="Total Mentors"
              value={totalMentors}
              icon={<Users size={24} />}
              color="orange"
            />
          </div>

          {/* ===== Recent Students ===== */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
              Recently Logged-in Students
            </h2>
            {recentStudents?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-700">
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Joined On</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((student: any) => (
                    <tr key={student._id} className="border-b border-gray-800">
                      <td className="py-2">
                        {student.student?.name ?? student.name}
                      </td>
                      <td>{student.student?.email ?? student.email}</td>
                      <td>
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm">
                No students logged in recently.
              </p>
            )}
          </div>

          {/* ===== Recent Mentors ===== */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
              Recently Logged-in Mentors
            </h2>
            {recentMentors?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-700">
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Joined On</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMentors.map((mentor: any) => (
                    <tr key={mentor._id} className="border-b border-gray-800">
                      <td className="py-2">
                        {mentor.mentor?.name ?? mentor.name}
                      </td>
                      <td>{mentor.mentor?.email ?? mentor.email}</td>
                      <td>
                        {new Date(mentor.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm">
                No mentors logged in recently.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
