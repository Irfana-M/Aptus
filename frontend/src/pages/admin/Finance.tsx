import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchFinanceData } from '../../features/admin/financeThunk';
import { Pagination } from '../../components/ui/Pagination';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { CreditCard } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';

export default function Finance() {
  const dispatch = useDispatch<AppDispatch>();
  const { payments, pagination, loading } = useSelector((state: RootState) => state.finance);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchFinanceData({page: currentPage, limit: itemsPerPage}));
  }, [dispatch, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  }

  const filteredPayments = payments.filter(p => 
    p.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.studentId?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.studentId?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalRevenue = () => {
    return payments.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.amount : 0), 0);
  };

  return (
    <AdminLayout title="Finance & Revenue" activeItem="Finance">
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
           <h3 className="text-3xl font-bold text-gray-900 mt-2">{pagination?.totalItems ?? payments.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <p className="text-gray-500 text-sm font-medium">Pending/Failed</p>
           <h3 className="text-3xl font-bold text-gray-900 mt-2">
             {payments.filter(p => p.status !== 'completed').length}
           </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex-1 w-full md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-sm w-full md:w-auto justify-center">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
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
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <Loader size="md" text="Loading transactions..." />
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState 
                      icon={CreditCard} 
                      title="No transactions found" 
                      description={searchTerm ? `No payments match "${searchTerm}"` : "There are no recorded transactions yet."}
                    />
                  </td>
                </tr>
              ) : filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-900">{payment.invoiceId}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{payment.studentId?.fullName || 'Unknown'}</span>
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
                  </td>
                  <td className="px-6 py-4">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* After the table */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                variant="detailed"
                className="px-6 py-4"
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
