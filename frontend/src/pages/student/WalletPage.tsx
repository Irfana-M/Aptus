import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
// import { toast } from "react-hot-toast";
import { getWallet } from "@/features/student/studentApi";
import { selectUser } from "@/features/auth/authSlice";
import StudentLayout from "@/components/students/StudentLayout";
import Card from "@/components/ui/Card";
// import { Button } from "@/components/ui/Button";

interface Transaction {
  _id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  source: string;
  description: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export default function WalletPage() {
  const user = useSelector(selectUser);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const data = await getWallet();
      setWallet(data);
    } catch {
     // toast.error("Failed to fetch wallet info");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <StudentLayout title="My Wallet">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>

        {/* Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="p-6 bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg">
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <p className="text-teal-100 font-medium mb-1">Current Balance</p>
                        <h2 className="text-4xl font-bold">
                            {wallet ? `₹${wallet.balance.toFixed(2)}` : '₹0.00'}
                        </h2>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-teal-100/80">
                            Use this balance for new subscriptions
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 border-dashed border-2 border-gray-200 flex flex-col justify-center items-center text-center space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 2 2 0 016 18.717m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 2 2 0 016 18.717" />
                    </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Refer & Earn</h3>
                <p className="text-sm text-gray-500">
                    Share your unique code to earn wallet rewards!
                </p>
                <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-lg tracking-wider select-all cursor-pointer border border-gray-300">
                     {user?.referralCode || 'Generate...'}
                </div>
            </Card>
        </div>

        {/* Transactions History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
            </div>
            
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading wallet info...</div>
            ) : !wallet?.transactions || wallet.transactions.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                         <span className="text-2xl text-gray-400">💸</span>
                    </div>
                    <p className="text-gray-500 font-medium">No transactions yet</p>
                    <p className="text-gray-400 text-sm">Credits and debits will appear here</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wallet.transactions.map((tx) => (
                                <tr key={tx._id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {formatDate(tx.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {tx.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${tx.source === 'REFERRAL' ? 'bg-purple-100 text-purple-800' : 
                                              tx.source === 'PURCHASE' ? 'bg-blue-100 text-blue-800' : 
                                              'bg-gray-100 text-gray-800'}`}>
                                            {tx.source}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold 
                                        ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </StudentLayout>
  );
}
