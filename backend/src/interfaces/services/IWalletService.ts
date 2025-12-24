export interface IWalletService {
  createWallet(studentId: string): Promise<void>;
  getWallet(studentId: string): Promise<unknown>; // Using unknown for now to avoid circular dependency or import issues, but ideally should be IWallet
  getBalance(studentId: string): Promise<number>;
  getTransactions(studentId: string): Promise<unknown[]>;
  creditWallet(studentId: string, amount: number, source: 'REFERRAL' | 'REWARD' | 'REFUND', description: string): Promise<void>;
  debitWallet(studentId: string, amount: number, source: 'PURCHASE', description: string): Promise<void>;
}
