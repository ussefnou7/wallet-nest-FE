import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineEye } from "react-icons/hi2";

export default function Plans() {
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
      toast({ title: "Plan created" });
      setOpen(false);
      resetCreateForm();
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
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
    } catch {
      toast({ title: "Failed to load plan", variant: "destructive" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/plans/${editPlanId}`, { name: editName, description: editDescription, maxUsers: editMaxUsers, maxWallets: editMaxWallets, maxBranches: editMaxBranches, active: editActive });
      toast({ title: "Plan updated" });
      setEditOpen(false);
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/plans/${id}`);
      toast({ title: "Plan deleted" });
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Plans">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{plans.length} plan(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><HiOutlinePlus className="w-4 h-4 mr-2" />Create Plan</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Plan</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" /></div>
              <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1.5" /></div>
              <div><Label>Max Users</Label><Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} required className="mt-1.5" /></div>
              <div><Label>Max Wallets</Label><Input type="number" value={maxWallets} onChange={(e) => setMaxWallets(Number(e.target.value))} required className="mt-1.5" /></div>
              <div><Label>Max Branches</Label><Input type="number" value={maxBranches} onChange={(e) => setMaxBranches(Number(e.target.value))} required className="mt-1.5" /></div>
              <div className="flex items-center justify-between"><Label htmlFor="plan-active">Active</Label><Switch id="plan-active" checked={active} onCheckedChange={setActive} /></div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Description</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Max Users</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Max Wallets</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Max Branches</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Active</th>
            <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {plans.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{p.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.description}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.maxUsers}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.maxWallets}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.maxBranches}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${p.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{p.active ? "Active" : "Inactive"}</span></td>
                <td className="p-4 text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/plans/${p.id}`)}><HiOutlineEye className="w-4 h-4" /> View</Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(p)}><HiOutlinePencil className="w-4 h-4" /> Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline" size="sm"><HiOutlineTrash className="w-4 h-4" /> Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Plan</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this plan? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
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
          <DialogHeader><DialogTitle>Edit Plan</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1.5" /></div>
            <div><Label>Description</Label><Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required className="mt-1.5" /></div>
            <div><Label>Max Users</Label><Input type="number" value={editMaxUsers} onChange={(e) => setEditMaxUsers(Number(e.target.value))} required className="mt-1.5" /></div>
            <div><Label>Max Wallets</Label><Input type="number" value={editMaxWallets} onChange={(e) => setEditMaxWallets(Number(e.target.value))} required className="mt-1.5" /></div>
            <div><Label>Max Branches</Label><Input type="number" value={editMaxBranches} onChange={(e) => setEditMaxBranches(Number(e.target.value))} required className="mt-1.5" /></div>
            <div className="flex items-center justify-between"><Label htmlFor="edit-plan-active">Active</Label><Switch id="edit-plan-active" checked={editActive} onCheckedChange={setEditActive} /></div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}