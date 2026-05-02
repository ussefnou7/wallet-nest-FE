import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Transaction, Wallet, TransactionType } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { extractList } from "@/lib/managedUserUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineFunnel } from "react-icons/hi2";

function occurredAtNow(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function Transactions() {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [open, setOpen] = useState(false);
  const [filterWallet, setFilterWallet] = useState("");
  const [filterType, setFilterType] = useState("");
  const { toast } = useToast();

  const [form, setForm] = useState({
    walletId: "", amount: "", type: "CREDIT" as TransactionType, phoneNumber: "", percent: "0", description: "", isCash: false,
  });

  const load = () => {
    const params: Record<string, string> = {};
    if (filterWallet && filterWallet !== "all") params.walletId = filterWallet;
    if (filterType && filterType !== "all") params.type = filterType;
    api.get("/transactions", { params }).then((r) => setTransactions(extractList(r.data) as Transaction[])).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get("/wallets").then((r) => setWallets(extractList(r.data) as Wallet[])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filterWallet, filterType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/transactions", {
        walletId: form.walletId,
        externalTransactionId: crypto.randomUUID(),
        amount: parseFloat(form.amount),
        type: form.type,
        percent: parseFloat(form.percent || "0"),
        phoneNumber: form.phoneNumber,
        description: form.description,
        cash: form.isCash,
        occurredAt: occurredAtNow(),
      });
      toast({ title: t("transactions.created") });
      setOpen(false);
      setForm({ walletId: "", amount: "", type: "CREDIT", phoneNumber: "", percent: "0", description: "", isCash: false });
      load();
    } catch (err) {
      toast({ title: t("transactions.failedCreate"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.transactions")}>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-3 items-center">
          <HiOutlineFunnel className="w-4 h-4 text-muted-foreground" />
          <Select value={filterWallet} onValueChange={setFilterWallet}>
            <SelectTrigger className="w-48"><SelectValue placeholder={t("common.allWallets")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allWallets")}</SelectItem>
              {wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36"><SelectValue placeholder={t("common.allTypes")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="CREDIT">{t("transactions.credit")}</SelectItem>
              <SelectItem value="DEBIT">{t("transactions.debit")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><HiOutlinePlus className="w-4 h-4 me-2" />{t("transactions.new")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{t("transactions.createTitle")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>{t("common.wallet")}</Label>
                <Select value={form.walletId} onValueChange={(v) => setForm({ ...form, walletId: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder={t("common.selectWallet")} /></SelectTrigger>
                  <SelectContent>{wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("transactions.columns.amount")}</Label><Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="mt-1.5" /></div>
                <div><Label>{t("transactions.percent")}</Label><Input type="number" step="0.01" min="0" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div>
                <Label>{t("common.type")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT">{t("transactions.credit")}</SelectItem>
                    <SelectItem value="DEBIT">{t("transactions.debit")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("common.phoneNumber")}</Label><Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required className="mt-1.5" /></div>
              <div><Label>{t("common.description")}</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isCash" checked={form.isCash} onChange={(e) => setForm({ ...form, isCash: e.target.checked })} className="rounded" />
                <Label htmlFor="isCash">{t("transactions.cash")}</Label>
              </div>
              <Button type="submit" className="w-full">{t("transactions.createTitle")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("transactions.columns.date")}</th>
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("transactions.columns.type")}</th>
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("transactions.transactionPhone")}</th>
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("transactions.wallet")}</th>
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("transactions.byUser")}</th>
              <th className="text-end text-xs font-medium text-muted-foreground p-4">{t("transactions.columns.amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">{t("transactions.noFound")}</td></tr>
            )}
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-sm text-foreground">{new Date(tx.occurredAt ?? tx.createdAt).toLocaleString(i18n.language)}</td>
                <td className="p-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${tx.type === "CREDIT" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {tx.type === "CREDIT" ? t("transactions.credit") : t("transactions.debit")}
                  </span>
                </td>
                <td className="p-4 text-sm text-foreground">{tx.phoneNumber || "—"}</td>
                <td className="p-4 text-sm text-foreground">{tx.walletName || t("transactions.unknownWallet")}</td>
                <td className="p-4 text-sm text-foreground">{tx.createdByUsername || t("transactions.unknownUser")}</td>
                <td className={`p-4 text-sm font-semibold text-end ${tx.type === "CREDIT" ? "text-credit" : "text-debit"}`}>
                  {tx.type === "CREDIT" ? "+" : "-"}${tx.amount.toLocaleString(i18n.language, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
