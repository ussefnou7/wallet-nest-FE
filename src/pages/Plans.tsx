import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Plan } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineEye } from "react-icons/hi2";

export default function Plans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxUsers, setMaxUsers] = useState(0);
  const [maxWallets, setMaxWallets] = useState(0);
  const [maxBranches, setMaxBranches] = useState(0);
  const [active, setActive] = useState(true);
  const [editPlanId, setEditPlanId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMaxUsers, setEditMaxUsers] = useState(0);
  const [editMaxWallets, setEditMaxWallets] = useState(0);
  const [editMaxBranches, setEditMaxBranches] = useState(0);
  const [editActive, setEditActive] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = () => api.get("/plans").then((r) => setPlans(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/plans", { name, description, maxUsers, maxWallets, maxBranches, active });
      toast({ title: t("plans.created") });
      setOpen(false);
      resetCreateForm();
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const resetCreateForm = () => {
    setName("");
    setDescription("");
    setMaxUsers(0);
    setMaxWallets(0);
    setMaxBranches(0);
    setActive(true);
  };

  const openEditDialog = async (plan: Plan) => {
    try {
      const res = await api.get(`/plans/${plan.id}`);
      const p = res.data;
      setEditPlanId(p.id);
      setEditName(p.name);
      setEditDescription(p.description);
      setEditMaxUsers(p.maxUsers);
      setEditMaxWallets(p.maxWallets);
      setEditMaxBranches(p.maxBranches);
      setEditActive(p.active);
      setEditOpen(true);
    } catch (err) {
      toast({ title: t("plans.failedLoad"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/plans/${editPlanId}`, { name: editName, description: editDescription, maxUsers: editMaxUsers, maxWallets: editMaxWallets, maxBranches: editMaxBranches, active: editActive });
      toast({ title: t("plans.updated") });
      setEditOpen(false);
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/plans/${id}`);
      toast({ title: t("plans.deleted") });
      load();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.plans")}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{t("plans.count", { count: plans.length })}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><HiOutlinePlus className="w-4 h-4 me-2" />{t("plans.new")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("plans.createTitle")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>{t("common.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" /></div>
              <div><Label>{t("common.description")}</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1.5" /></div>
              <div><Label>{t("plans.maxUsers")}</Label><Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} required className="mt-1.5" /></div>
              <div><Label>{t("plans.maxWallets")}</Label><Input type="number" value={maxWallets} onChange={(e) => setMaxWallets(Number(e.target.value))} required className="mt-1.5" /></div>
              <div><Label>{t("plans.maxBranches")}</Label><Input type="number" value={maxBranches} onChange={(e) => setMaxBranches(Number(e.target.value))} required className="mt-1.5" /></div>
              <div className="flex items-center justify-between"><Label htmlFor="plan-active">{t("common.active")}</Label><Switch id="plan-active" checked={active} onCheckedChange={setActive} /></div>
              <Button type="submit" className="w-full">{t("common.create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.name")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.description")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("plans.maxUsers")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("plans.maxWallets")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("plans.maxBranches")}</th>
            <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.active")}</th>
            <th className="text-end text-xs font-medium text-muted-foreground p-4">{t("common.actions")}</th>
          </tr></thead>
          <tbody className="divide-y">
            {plans.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{p.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.description}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.maxUsers}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.maxWallets}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.maxBranches}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${p.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{p.active ? t("common.active") : t("common.inactive")}</span></td>
                <td className="p-4 text-end flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/plans/${p.id}`)}><HiOutlineEye className="w-4 h-4" /> {t("common.view")}</Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(p)}><HiOutlinePencil className="w-4 h-4" /> {t("common.edit")}</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline" size="sm"><HiOutlineTrash className="w-4 h-4" /> {t("common.delete")}</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>{t("plans.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("plans.confirmDelete")}</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id!)}>{t("common.delete")}</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("plans.editTitle")}</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>{t("common.name")}</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1.5" /></div>
            <div><Label>{t("common.description")}</Label><Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required className="mt-1.5" /></div>
            <div><Label>{t("plans.maxUsers")}</Label><Input type="number" value={editMaxUsers} onChange={(e) => setEditMaxUsers(Number(e.target.value))} required className="mt-1.5" /></div>
            <div><Label>{t("plans.maxWallets")}</Label><Input type="number" value={editMaxWallets} onChange={(e) => setEditMaxWallets(Number(e.target.value))} required className="mt-1.5" /></div>
            <div><Label>{t("plans.maxBranches")}</Label><Input type="number" value={editMaxBranches} onChange={(e) => setEditMaxBranches(Number(e.target.value))} required className="mt-1.5" /></div>
            <div className="flex items-center justify-between"><Label htmlFor="edit-plan-active">{t("common.active")}</Label><Switch id="edit-plan-active" checked={editActive} onCheckedChange={setEditActive} /></div>
            <Button type="submit" className="w-full">{t("common.save")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
