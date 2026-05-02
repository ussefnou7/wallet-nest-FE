import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { Wallet } from "@/lib/types";
import { getFieldError, getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

export default function Wallets() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; tenantId?: string }>>([]);
  const [walletTypes, setWalletTypes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tenantId: "",
    branchId: "",
    type: "",
    number: "",
    balance: "",
    dailyLimit: "",
    monthlyLimit: "",
  });
  const [numberError, setNumberError] = useState("");
  const { toast } = useToast();
  const canManage = user?.role === "SYSTEM_ADMIN" || user?.role === "OWNER";

  const load = () => api.get("/wallets").then((r) => setWallets(extractList(r.data) as Wallet[])).catch(() => {});

  const extractList = (raw: unknown): unknown[] => {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== "object") return [];
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.content)) return obj.content;
    return [];
  };

  const normalizeTenants = (raw: unknown): Array<{ id: string; name: string }> => {
    return extractList(raw)
      .map((item) => {
        const value = item as Record<string, unknown>;
        const id = value.id ?? value.tenantId ?? value.uuid;
        const name = value.name ?? value.tenantName;
        return {
          id: id ? String(id) : "",
          name: name ? String(name) : "",
        };
      })
      .filter((item) => item.id && item.name);
  };

  const normalizeBranches = (raw: unknown): Array<{ id: string; name: string; tenantId?: string }> => {
    return extractList(raw)
      .map((item) => {
        const value = item as Record<string, unknown>;
        const id = value.id ?? value.branchId ?? value.uuid;
        const name = value.name ?? value.branchName;
        const tenantId = value.tenantId ?? value.tenantUUID;
        return {
          id: id ? String(id) : "",
          name: name ? String(name) : "",
          tenantId: tenantId ? String(tenantId) : undefined,
        };
      })
      .filter((item) => item.id && item.name);
  };

  const loadCreateFormData = async () => {
    try {
      const [tenantsRes, walletTypesRes] = await Promise.all([
        api.get("/tenants"),
        api.get("/wallets/types"),
      ]);
      setTenants(normalizeTenants(tenantsRes.data));
      setWalletTypes(extractList(walletTypesRes.data).map((item) => String(item)));
    } catch {
      // Keep dialog usable even if one endpoint fails.
    }

    try {
      const branchesRes = await api.get("/branches");
      setBranches(normalizeBranches(branchesRes.data));
    } catch {
      // Ignore branch list failure; submit will still validate selection.
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetCreateForm = () => {
    setForm({
      name: "",
      tenantId: "",
      branchId: "",
      type: "",
      number: "",
      balance: "",
      dailyLimit: "",
      monthlyLimit: "",
    });
    setNumberError("");
  };

  const validateWalletNumber = (value: string) => /^01\d{9}$/.test(value);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.tenantId || !form.branchId || !form.type) {
      toast({ title: t("wallets.required"), variant: "destructive" });
      return;
    }
    if (!validateWalletNumber(form.number)) {
      setNumberError(t("wallets.invalidNumber"));
      return;
    }
    if (!form.balance) {
      toast({ title: t("wallets.balanceRequired"), variant: "destructive" });
      return;
    }

    try {
      await api.post("/wallets", {
        name: form.name,
        number: form.number,
        tenantId: form.tenantId,
        branchId: form.branchId,
        type: form.type,
        balance: parseFloat(form.balance),
        dailyLimit: form.dailyLimit ? parseFloat(form.dailyLimit) : null,
        monthlyLimit: form.monthlyLimit ? parseFloat(form.monthlyLimit) : null,
      });
      toast({ title: t("wallets.created") });
      setOpen(false);
      resetCreateForm();
      load();
    } catch (err) {
      const fieldError = getFieldError(err, "number");
      if (fieldError) setNumberError(fieldError);
      toast({ title: t("wallets.failedCreate"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/wallets/${id}`);
      toast({ title: t("wallets.deleted") });
      load();
    } catch (err) {
      toast({ title: t("wallets.failedDelete"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.wallets")}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{t("wallets.count", { count: wallets.length })}</p>
        {canManage && (
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (v) loadCreateFormData();
              if (!v) resetCreateForm();
            }}
          >
            <DialogTrigger asChild>
              <Button><HiOutlinePlus className="w-4 h-4 me-2" />{t("wallets.new")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("wallets.createTitle")}</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>{t("common.name")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>{t("common.tenant")}</Label>
                  <Select
                    value={form.tenantId}
                    onValueChange={(v) => setForm({ ...form, tenantId: v, branchId: "" })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={t("common.selectTenant")} />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("tabs.branches")}</Label>
                  <Select
                    value={form.branchId}
                    onValueChange={(v) => setForm({ ...form, branchId: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={t("common.selectBranch")} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches
                        .filter((branch) => !form.tenantId || !branch.tenantId || branch.tenantId === form.tenantId)
                        .map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("wallets.walletType")}</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={t("wallets.selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {walletTypes.map((walletType) => (
                        <SelectItem key={walletType} value={walletType}>{walletType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("wallets.columns.number")}</Label>
                  <Input
                    value={form.number}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, number: value });
                      if (numberError) setNumberError("");
                    }}
                    required
                    maxLength={11}
                    placeholder="01XXXXXXXXX"
                    className="mt-1.5"
                  />
                  {numberError && <p className="text-sm text-destructive mt-1">{numberError}</p>}
                </div>
                <div>
                  <Label>{t("wallets.columns.balance")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>{t("wallets.daily_limit")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.dailyLimit}
                    onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>{t("wallets.monthly_limit")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.monthlyLimit}
                    onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full">{t("common.create")}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((w) => (
          <div key={w.id} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">{w.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${w.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {w.active ? t("common.active") : t("common.inactive")}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary mb-3">${w.balance.toLocaleString(i18n.language, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mb-1">{t("wallets.tenantLabel", { value: w.tenantName ?? "—" })}</p>
            <p className="text-xs text-muted-foreground mb-4">{t("wallets.typeLabel", { value: w.type || "—" })}</p>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDelete(w.id)}>
                  <HiOutlineTrash className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
