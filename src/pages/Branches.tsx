import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Branch } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from "react-icons/hi2";

export default function Branches() {
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
        return {
          id: id ? String(id) : undefined,
          name: name ? String(name) : "",
          tenantName: tenantName ? String(tenantName) : undefined,
          active: Boolean(active),
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
      toast({ title: "Tenant is required", variant: "destructive" });
      return;
    }
    try {
      await api.post("/branches", { tenantId, name });
      toast({ title: "Branch created" });
      setOpen(false);
      setName("");
      setTenantId("");
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/branches/${id}`);
      toast({ title: "Branch deleted" });
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
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
      toast({ title: "Branch updated" });
      setEditOpen(false);
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Branches">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{branches.length} branch(es)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><HiOutlinePlus className="w-4 h-4 mr-2" />New Branch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Branch</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Tenant</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {branches.map((b, i) => (
              <tr key={b.id || i} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{b.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{b.tenantName ?? "—"}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${b.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{b.active ? "Active" : "Inactive"}</span></td>
                <td className="p-4 text-right space-x-2">
                  {b.id && (
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(b)}>
                      <HiOutlinePencil className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                  {b.id && (
                    <Button variant="outline" size="sm" onClick={() => handleDelete(b.id)}>
                      <HiOutlineTrash className="w-4 h-4" />
                      Delete
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
          <DialogHeader><DialogTitle>Edit Branch</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="branch-active">Active</Label>
              <Switch id="branch-active" checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
