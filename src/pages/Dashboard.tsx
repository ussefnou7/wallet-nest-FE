import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { Wallet, Transaction } from "@/lib/types";
import { extractList } from "@/lib/managedUserUtils";
import { HiOutlineCreditCard, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineBanknotes } from "react-icons/hi2";

export default function Dashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    api.get("/wallets").then((r) => setWallets(extractList(r.data) as Wallet[])).catch(() => {});
    api.get("/transactions").then((r) => setTransactions(extractList(r.data) as Transaction[])).catch(() => {});
  }, []);

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const totalCredits = transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);

  const stats = [
    { label: t("dashboard.totalBalance"), value: totalBalance, icon: HiOutlineBanknotes, color: "text-primary" },
    { label: t("dashboard.activeWallets"), value: wallets.filter((w) => w.active).length, icon: HiOutlineCreditCard, color: "text-primary", isCurrency: false },
    { label: t("dashboard.totalCredits"), value: totalCredits, icon: HiOutlineArrowTrendingUp, color: "text-credit" },
    { label: t("dashboard.totalDebits"), value: totalDebits, icon: HiOutlineArrowTrendingDown, color: "text-debit" },
  ];

  const recentTx = transactions.slice(0, 8);

  return (
    <DashboardLayout title={t("dashboard.title", { username: user?.username })}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>
              {s.isCurrency === false ? s.value : `$${Number(s.value).toLocaleString(i18n.language, { minimumFractionDigits: 2 })}`}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">{t("dashboard.recentTransactions")}</h2>
        </div>
        <div className="divide-y">
          {recentTx.length === 0 && <p className="p-6 text-muted-foreground text-sm">{t("dashboard.noTransactionsYet")}</p>}
          {recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {tx.type === "CREDIT" ? t("transactions.credit") : t("transactions.debit")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("transactions.transactionPhone")}: {tx.phoneNumber || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("transactions.wallet")}: {tx.walletName || t("transactions.unknownWallet")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("transactions.byUser")}: {tx.createdByUsername || t("transactions.unknownUser")}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(tx.occurredAt ?? tx.createdAt).toLocaleString(i18n.language)}</p>
              </div>
              <span className={`text-sm font-semibold ${tx.type === "CREDIT" ? "text-credit" : "text-debit"}`}>
                {tx.type === "CREDIT" ? "+" : "-"}${tx.amount.toLocaleString(i18n.language, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
