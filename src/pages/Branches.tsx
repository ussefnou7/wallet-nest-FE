import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Branch } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from "react-icons/hi2";

export default function Branches() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const { toast } = useToast();

  const normalizeBranches = (raw: unknown): Branch[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((value) => {
        const branch = value as Record<string, unknown>;
        const tenant = branch.tenant as Record<string, unknown> | undefined;
        const id = branch.id ?? branch.branchId ?? branch.uuid;
        const name = branch.name ?? branch.branchName;
        const tenantName = branch.tenantName ?? tenant?.name;
        const active = branch.active ?? true;
        const userCount = Number(branch.userCount ?? 0);
        const walletCount = Number(branch.walletCount ?? 0);
        return {
          id: id ? String(id) : undefined,
          name: name ? String(name) : "",
          tenantName: tenantName ? String(tenantName) : undefined,
          active: Boolean(active),
          userCount: Number.isFinite(userCount) ? userCount : 0,
          walletCount: Number.isFinite(walletCount) ? walletCount : 0,
        } as Branch;
      })
      .filter((item) => item.id && item.name);
  };

  const load = () => api.get("/branches").then((r) => setBranches(normalizeBranches(r.data))).catch(() => {});
  const loadTenants = () => api.get("/tenants").then((r) => setTenants(r.data || [])).catch(() => {});
  useEffect(() => {
    load();
    loadTenants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      toast({ title: t("owners.tenantRequired"), variant: "destructive" });
      return;
    }
    try {
      await api.post("/branches", { tenantId, name });
      toast({ title: t("branches.created") });
      setOpen(false);
      setName("");
      setTenantId("");
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/branches/${id}`);
      toast({ title: t("branches.deleted") });
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const openEditDialog = (branch: Branch) => {
    setEditBranchId(branch.id ?? "");
    setEditName(branch.name);
    setEditActive(branch.active ?? true);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/branches/${editBranchId}`, { name: editName, active: editActive });
      toast({ title: t("branches.updated") });
      setEditOpen(false);
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.branches")}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{t("branches.count", { count: branches.length })}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><HiOutlinePlus className="w-4 h-4 me-2" />{t("branches.new")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("branches.createTitle")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>{t("common.tenant")}</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
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
              <div><Label>{t("common.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" /></div>
              <Button type="submit" className="w-full">{t("common.create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.name")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.tenant")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("branches.userCount")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("branches.walletCount")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.status")}</th>
            <th className="text-end text-xs font-medium text-muted-foreground p-4">{t("common.actions")}</th>
          </tr></thead>
          <tbody className="divide-y">
            {branches.map((b, i) => (
              <tr key={b.id || i} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{b.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{b.tenantName ?? "—"}</td>
                <td className="p-4 text-sm text-muted-foreground">{b.userCount ?? 0}</td>
                <td className="p-4 text-sm text-muted-foreground">{b.walletCount ?? 0}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${b.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{b.active ? t("common.active") : t("common.inactive")}</span></td>
                <td className="p-4 text-end flex justify-end gap-2">
                  {b.id && (
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(b)}>
                      <HiOutlinePencil className="w-4 h-4" />
                      {t("common.edit")}
                    </Button>
                  )}
                  {b.id && (
                    <Button variant="outline" size="sm" onClick={() => handleDelete(b.id)}>
                      <HiOutlineTrash className="w-4 h-4" />
                      {t("common.delete")}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("branches.editTitle")}</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>{t("common.name")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="branch-active">{t("common.active")}</Label>
              <Switch id="branch-active" checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <Button type="submit" className="w-full">{t("common.save")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
