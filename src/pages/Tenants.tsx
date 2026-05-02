import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Tenant } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

export default function Tenants() {
  const { t, i18n } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [editTenantId, setEditTenantId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editActive, setEditActive] = useState(true);
  const { toast } = useToast();

  const load = () => api.get("/tenants").then((r) => setTenants(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tenants", { name, phoneNumber });
      toast({ title: t("tenants.created") });
      setOpen(false);
      setName("");
      setPhoneNumber("");
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tenants/${id}`);
      toast({ title: t("tenants.deleted") });
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditTenantId(tenant.id);
    setEditName(tenant.name);
    setEditPhoneNumber(tenant.phoneNumber || "");
    setEditActive(tenant.active);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/tenants/${editTenantId}`, { name: editName, phoneNumber: editPhoneNumber, active: editActive });
      toast({ title: t("tenants.updated") });
      setEditOpen(false);
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.tenants")}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{t("tenants.count", { count: tenants.length })}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><HiOutlinePlus className="w-4 h-4 me-2" />{t("tenants.new")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("tenants.createTitle")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>{t("common.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" /></div>
              <div><Label>{t("common.phoneNumber")}</Label><Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1.5" /></div>
              <Button type="submit" className="w-full">{t("common.create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.name")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.phoneNumber")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.status")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.created")}</th>
            <th className="text-end text-xs font-medium text-muted-foreground p-4">{t("common.actions")}</th>
          </tr></thead>
          <tbody className="divide-y">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{tenant.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{tenant.phoneNumber || "-"}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${tenant.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{tenant.active ? t("common.active") : t("common.inactive")}</span></td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString(i18n.language)}</td>
                <td className="p-4 text-end flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(tenant)}>{t("common.edit")}</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(tenant.id)}><HiOutlineTrash className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("tenants.editTitle")}</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>{t("common.name")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>{t("common.phoneNumber")}</Label>
              <Input value={editPhoneNumber} onChange={(e) => setEditPhoneNumber(e.target.value)} className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tenant-active">{t("common.active")}</Label>
              <Switch id="tenant-active" checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <Button type="submit" className="w-full">{t("common.save")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
