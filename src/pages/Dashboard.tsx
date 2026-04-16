import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { Wallet, Transaction } from "@/lib/types";
import { HiOutlineCreditCard, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineBanknotes } from "react-icons/hi2";

export default function Dashboard() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    api.get("/wallets").then((r) => setWallets(r.data)).catch(() => {});
    api.get("/transactions").then((r) => setTransactions(r.data)).catch(() => {});
  }, []);

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const totalCredits = transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);

  const stats = [
    { label: "Total Balance", value: totalBalance, icon: HiOutlineBanknotes, color: "text-primary" },
    { label: "Active Wallets", value: wallets.filter((w) => w.active).length, icon: HiOutlineCreditCard, color: "text-primary", isCurrency: false },
    { label: "Total Credits", value: totalCredits, icon: HiOutlineArrowTrendingUp, color: "text-credit" },
    { label: "Total Debits", value: totalDebits, icon: HiOutlineArrowTrendingDown, color: "text-debit" },
  ];

  const recentTx = transactions.slice(0, 8);

  return (
    <DashboardLayout title={`Welcome back, ${user?.username}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>
              {s.isCurrency === false ? s.value : `$${Number(s.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        </div>
        <div className="divide-y">
          {recentTx.length === 0 && <p className="p-6 text-muted-foreground text-sm">No transactions yet.</p>}
          {recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">{tx.description || "Transaction"}</p>
                <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-semibold ${tx.type === "CREDIT" ? "text-credit" : "text-debit"}`}>
                {tx.type === "CREDIT" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
