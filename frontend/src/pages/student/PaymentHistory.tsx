import React, { useEffect } from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { CreditCard, Calendar, Clock, Download } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentPaymentHistory } from '../../features/payment/paymentThunk';
import { fetchStudentProfile } from '../../features/student/studentThunk';
import type { RootState, AppDispatch } from '../../app/store';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';

interface Payment {
    _id: string;
    invoiceId?: string;
    createdAt?: string;
    paymentDate?: string;
    purpose?: string;
    amount: number;
    currency?: string;
    status: string;
    method?: string;
    transactionId?: string;
    courseId?: {
        subject?: {
            subjectName: string;
        }
    } | string;
}

const PaymentHistory: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { paymentHistory, loading } = useSelector((state: RootState) => state.payment);
    const { user } = useSelector((state: RootState) => state.auth);
    const studentProfile = useSelector((state: RootState) => state.student?.profile);

    // Use subscription from profile (more current) or fallback to auth.user
    const subscription = studentProfile?.subscription || (user as unknown as { subscription?: { 
        expiryDate?: string; 
        renewalDate?: string; 
        endDate?: string; 
        plan?: string; 
        subjectCount?: number 
    } })?.subscription;

    useEffect(() => {
        if (user?._id) {
            dispatch(fetchStudentPaymentHistory(user._id));
            dispatch(fetchStudentProfile()); // Fetch fresh profile for subscription data
        }
    }, [dispatch, user]);

    const handleDownloadReceipt = (payment: Payment) => {
        const receiptContent = `
-------------------------------------------
          APTUS LEARNING RECEIPT
-------------------------------------------
Invoice ID: ${payment.invoiceId || 'N/A'}
Date: ${new Date(payment.createdAt || payment.paymentDate || '').toLocaleString()}
Student: ${user?.fullName || 'N/A'}
Email: ${user?.email || 'N/A'}

Plan: ${payment.purpose || 'Subscription'}
Amount Paid: ₹${payment.amount}
Currency: ${payment.currency?.toUpperCase() || 'INR'}
Status: ${payment.status?.toUpperCase()}
Method: ${payment.method?.toUpperCase() || 'STRIPE'}
Transaction ID: ${payment.transactionId || 'N/A'}

-------------------------------------------
Thank you for choosing Aptus for your learning!
-------------------------------------------
        `.trim();

        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receipt_${payment.invoiceId || 'payment'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadStatement = () => {
        if (!paymentHistory || paymentHistory.length === 0) return;
        
        let statement = "APTUS LEARNING - PAYMENT STATEMENT\n";
        statement += `Student: ${user?.fullName}\n`;
        statement += `Generated on: ${new Date().toLocaleString()}\n\n`;
        statement += "Date | Description | Amount | Status | Invoice\n";
        statement += "--------------------------------------------------\n";
        
        paymentHistory.forEach(p => {
            const date = new Date(p.createdAt || p.paymentDate || '').toLocaleDateString();
            statement += `${date} | ${p.purpose || 'Subscription'} | ₹${p.amount} | ${p.status} | ${p.invoiceId}\n`;
        });

        const blob = new Blob([statement], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Aptus_Statement_${user?.fullName?.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
         return (
            <StudentLayout title="Payment History">
                <div className="flex justify-center items-center h-64">
                    <Loader size="md" text="Loading transaction history..." />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="Payment History">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
                    <button 
                        onClick={handleDownloadStatement}
                        className="px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
                    >
                        Download Statement
                    </button>
                </div>

                {/* Subscription Summary Section */}
                <div className="p-6 bg-slate-50 border-b border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Validity Expiration</p>
                                <p className="text-lg font-black text-gray-800">
                                    {subscription?.expiryDate 
                                        ? new Date(subscription.expiryDate).toLocaleDateString() 
                                        : (subscription?.endDate 
                                            ? new Date(subscription.endDate).toLocaleDateString() 
                                            : 'No active plan')}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Renewal Due Date</p>
                                <p className="text-lg font-black text-gray-800">
                                    {subscription?.renewalDate 
                                        ? new Date(subscription.renewalDate).toLocaleDateString() 
                                        : (subscription?.endDate 
                                            ? new Date(subscription.endDate).toLocaleDateString()
                                            : 'N/A')}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Payment Due</p>
                                <p className="text-lg font-black text-gray-800">
                                    ₹{
                                        subscription?.plan === 'yearly' 
                                            ? (subscription?.subjectCount === 1 ? '5000' : '10000')
                                            : ((subscription?.subjectCount || 1) * 500)
                                    }
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
                
                {paymentHistory && paymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paymentHistory.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-gray-400" />
                                                {(payment.createdAt || payment.paymentDate) 
                                                    ? new Date((payment.createdAt || payment.paymentDate) as string).toLocaleDateString() 
                                                    : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-gray-900">
                                                {payment.purpose || (typeof payment.courseId === 'object' && payment.courseId
                                                    ? (payment.courseId as { subject?: { subjectName: string } })?.subject?.subjectName 
                                                    : 'Course Payment')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            ₹{payment.amount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                payment.status === 'succeeded' || payment.status === 'completed'
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                         <td 
                                            className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                            onClick={() => handleDownloadReceipt(payment)}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className="underline">{payment.invoiceId || 'Download'}</span>
                                                <Download size={16} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState 
                        icon={CreditCard} 
                        title="No payment history" 
                        description="You haven't made any transactions yet." 
                    />
                )}
            </div>
        </StudentLayout>
    );
};

export default PaymentHistory;
