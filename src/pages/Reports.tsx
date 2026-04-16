import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Wallet, BalanceReport, ProfitReport } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Reports() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [balance, setBalance] = useState<BalanceReport | null>(null);
  const [profit, setProfit] = useState<ProfitReport | null>(null);

  useEffect(() => {
    api.get("/wallets").then((r) => setWallets(r.data)).catch(() => {});
    api.get("/reports/profit").then((r) => setProfit(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      api.get("/reports/balance", { params: { walletId: selectedWallet } }).then((r) => setBalance(r.data)).catch(() => setBalance(null));
    }
  }, [selectedWallet]);

  return (
    <DashboardLayout title="Reports">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Wallet Balance</h2>
          <div className="mb-4">
            <Label>Select Wallet</Label>
            <Select value={selectedWallet} onValueChange={setSelectedWallet}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a wallet" /></SelectTrigger>
              <SelectContent>{wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {balance && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{balance.walletName}</p>
              <p className="text-3xl font-bold text-primary">${balance.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        {profit && (
          <div className="stat-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Total Profit</h2>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Tenant Profit</p>
              <p className="text-3xl font-bold text-success">${profit.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
