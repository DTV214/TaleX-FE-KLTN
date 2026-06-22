export type CoinWallet = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
};

export type CoinTransaction = {
  transactionId: string;
  amount: number;
  transactionType: string;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  description: string;
  changedAt: string;
};

export type DailyCheckInStatus = {
  isCheckedInToday: boolean;
  currentStreak: number;
};

export type DailyCheckInResponse = {
  rewardAmount: number;
  currentStreak: number;
};
