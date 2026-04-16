import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [editTenantId, setEditTenantId] = useState("");
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const { toast } = useToast();

  const load = () => api.get("/tenants").then((r) => setTenants(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tenants", { name });
      toast({ title: "Tenant created" });
      setOpen(false);
      setName("");
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tenants/${id}`);
      toast({ title: "Tenant deleted" });
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditTenantId(tenant.id);
    setEditName(tenant.name);
    setEditActive(tenant.active);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/tenants/${editTenantId}`, { name: editName, active: editActive });
      toast({ title: "Tenant updated" });
      setEditOpen(false);
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Tenants">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{tenants.length} tenant(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><HiOutlinePlus className="w-4 h-4 mr-2" />New Tenant</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Tenant</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" /></div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Created</th>
            <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{t.name}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${t.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{t.active ? "Active" : "Inactive"}</span></td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(t)}>Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)}><HiOutlineTrash className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tenant</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tenant-active">Active</Label>
              <Switch id="tenant-active" checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
