import React, { useState } from "react";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { Table } from "../../components/admin/Table";
interface Booking {
  _id: string;
  studentName: string;
  subject: string;
  mentor: string;
  timeSlot: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  notification: string;
}

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

export const BookingsManagement: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Bookings");

  const [bookings] = useState<Booking[]>([
    {
      _id: "1",
      studentName: "Sophia Clark",
      subject: "Mathematics",
      mentor: "Dr. Ethan Bennett",
      timeSlot: "2024-10-15 10:00 AM",
      status: "Confirmed",
      notification: "Notify Student",
    },
    {
      _id: "2",
      studentName: "Liam Harris",
      subject: "Physics",
      mentor: "Dr. Olivia Carter",
      timeSlot: "2024-10-16 02:00 PM",
      status: "Pending",
      notification: "Notify Student",
    },
    {
      _id: "3",
      studentName: "Ava Turner",
      subject: "Chemistry",
      mentor: "Dr. Noah Foster",
      timeSlot: "2024-10-17 11:00 AM",
      status: "Confirmed",
      notification: "Notify Student",
    },
    {
      _id: "4",
      studentName: "Jackson Reed",
      subject: "Biology",
      mentor: "Dr. Isabella Hayes",
      timeSlot: "2024-10-18 09:00 AM",
      status: "Confirmed",
      notification: "Notify Student",
    },
    {
      _id: "5",
      studentName: "Chloe Morgan",
      subject: "English Literature",
      mentor: "Dr. Caleb Mitchell",
      timeSlot: "2024-10-19 03:00 PM",
      status: "Confirmed",
      notification: "Notify Student",
    },
    {
      _id: "6",
      studentName: "Lucas Cooper",
      subject: "History",
      mentor: "Dr. Amelia Simmons",
      timeSlot: "2024-10-20 01:00 PM",
      status: "Pending",
      notification: "Notify Student",
    },
    {
      _id: "7",
      studentName: "Mia Parker",
      subject: "Computer Science",
      mentor: "Dr. Elijah Wright",
      timeSlot: "2024-10-21 04:00 PM",
      status: "Confirmed",
      notification: "Notify Student",
    },
    {
      _id: "8",
      studentName: "Owen Bennett",
      subject: "Economics",
      mentor: "Dr. Harper Coleman",
      timeSlot: "2024-10-22 10:00 AM",
      status: "Confirmed",
      notification: "Notify Student",
    },
    {
      _id: "9",
      studentName: "Grayson Foster",
      subject: "Sociology",
      mentor: "Dr. Penelope Hunt",
      timeSlot: "2024-10-24 02:00 PM",
      status: "Confirmed",
      notification: "Notify Student",
    },
    {
      _id: "10",
      studentName: "Lily Anderson",
      subject: "Art History",
      mentor: "Dr. Sebastian Price",
      timeSlot: "2024-10-25 11:00 AM",
      status: "Pending",
      notification: "Notify Student",
    },
  ]);

  const totalStudents = 250;
  const totalSubjects = 36;
  const totalMentors = 120;
  const pendingRequests = bookings.filter(b => b.status === "Pending").length;

  const columns: Column<Booking>[] = [
    {
      header: "Student Name",
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.studentName}</span>
      ),
    },
    {
      header: "Subject",
      accessor: (row) => (
        <span className="text-gray-700">{row.subject}</span>
      ),
    },
    {
      header: "Mentor",
      accessor: (row) => (
        <span className="text-gray-700">{row.mentor}</span>
      ),
    },
    {
      header: "Time Slot",
      accessor: (row) => (
        <span className="text-gray-700">{row.timeSlot}</span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "Confirmed"
              ? "bg-green-100 text-green-800"
              : row.status === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      accessor: (row) => (
        <button 
          className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // Handle notification
            console.log(`Notify ${row.studentName}`);
          }}
        >
          {row.notification}
        </button>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        activeItem={activeNav}
        onItemClick={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Bookings"
          user={{
            name: "Admin User",
            email: "admin@mentora.com",
          }}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <p className="text-gray-600 text-sm font-medium mb-2">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <p className="text-gray-600 text-sm font-medium mb-2">Subjects</p>
                <p className="text-3xl font-bold text-gray-900">{totalSubjects}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <p className="text-gray-600 text-sm font-medium mb-2">Mentors</p>
                <p className="text-3xl font-bold text-gray-900">{totalMentors}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <p className="text-gray-600 text-sm font-medium mb-2">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-900">{pendingRequests}</p>
              </div>
            </div>
          </div>

          {/* All Bookings Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
              <div className="flex items-center space-x-3">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                  title="Filter"
                  onClick={() => console.log('Filter clicked')}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                  title="Download"
                  onClick={() => console.log('Download clicked')}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button 
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 font-medium"
                  onClick={() => console.log('Export clicked')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export</span>
                </button>
              </div>
            </div>

            <Table<Booking>
              columns={columns}
              data={bookings}
              emptyMessage="No bookings found"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingsManagement;