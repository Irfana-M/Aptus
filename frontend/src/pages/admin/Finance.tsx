import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/admin/Sidebar';
import { Topbar } from '../../components/admin/Topbar';
// import { adminAxios } from '../../api/axiosConfig'; // No longer needed directly
import { Download, Search } from 'lucide-react';
// import toast from 'react-hot-toast'; // Handled by slice if needed or generic error UI
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchFinanceData } from '../../features/admin/financeThunk';



export default function Finance() {
  const dispatch = useDispatch<AppDispatch>();
  const { payments, loading } = useSelector((state: RootState) => state.finance);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchFinanceData());
  }, [dispatch]);

  /* 
  // Old Fetch Logic Removed
  // const fetchPayments = ...
  */

  const filteredPayments = payments.filter(p => 
    p.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.studentId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.studentId?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalRevenue = () => {
    return payments.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.amount : 0), 0);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        activeItem="Finance"
        onItemClick={() => { /* Handle navigation if needed, typically managed by Sidebar internal state or location */ }}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title="Finance & Revenue" />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                ₹{calculateTotalRevenue().toLocaleString()}
              </h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <p className="text-gray-500 text-sm font-medium">Transactions</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-2">{payments.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <p className="text-gray-500 text-sm font-medium">Pending/Failed</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-2">
                 {payments.filter(p => p.status !== 'completed').length}
               </h3>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by invoice, student name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              <Download size={20} />
              <span>Export Report</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs">
                  <tr>
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Purpose</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center">Loading transactions...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center">No transactions found</td></tr>
                  ) : filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-900">{payment.invoiceId}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{payment.studentId?.name || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">{payment.studentId?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{payment.purpose}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                         ₹{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {payment.status}
                        </span>
                        <div className="text-xs text-gray-400 mt-1 uppercase">{payment.method}</div>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
