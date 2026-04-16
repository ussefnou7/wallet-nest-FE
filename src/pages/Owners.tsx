import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { extractList, normalizeUser } from "@/lib/managedUserUtils";
import type { ManagedUser, Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from "react-icons/hi2";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Owners() {
  const [owners, setOwners] = useState<ManagedUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tenantPickerOpen, setTenantPickerOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createTenantId, setCreateTenantId] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);
  const { toast } = useToast();

  const loadOwners = () =>
    api
      .get("/users/owners")
      .then((r) => {
        const list = extractList(r.data)
          .map(normalizeUser)
          .filter((u): u is ManagedUser => u !== null);
        setOwners(list);
      })
      .catch(() => {});

  const loadTenants = () =>
    api
      .get("/tenants")
      .then((r) => {
        const raw = Array.isArray(r.data) ? r.data : extractList(r.data);
        setTenants(raw as Tenant[]);
      })
      .catch(() => {});

  useEffect(() => {
    loadOwners();
    loadTenants();
  }, []);

  const resetCreate = () => {
    setCreateUsername("");
    setCreatePassword("");
    setCreateTenantId("");
  };

  const selectedTenant = tenants.find((t) => t.id === createTenantId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTenantId) {
      toast({ title: "Tenant is required", variant: "destructive" });
      return;
    }
    try {
      await api.post("/users/create-owner", {
        username: createUsername,
        password: createPassword,
        role: "OWNER",
        tenantId: createTenantId,
      });
      toast({ title: "Owner created" });
      setOpen(false);
      resetCreate();
      loadOwners();
    } catch {
      toast({ title: "Failed to create owner", variant: "destructive" });
    }
  };

  const openEdit = (user: ManagedUser) => {
    setEditUserId(user.id);
    setEditUsername(user.username);
    setEditPassword("");
    setEditActive(user.active !== false);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { username: string; active: boolean; password?: string } = {
      username: editUsername,
      active: editActive,
    };
    if (editPassword.trim()) payload.password = editPassword;
    try {
      await api.put(`/users/${editUserId}`, payload);
      toast({ title: "Owner updated" });
      setEditOpen(false);
      loadOwners();
    } catch {
      toast({ title: "Failed to update owner", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      toast({ title: "Owner deleted" });
      loadOwners();
    } catch {
      toast({ title: "Failed to delete owner", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Owners">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{owners.length} owner(s)</p>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetCreate();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              New Owner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Owner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Tenant</Label>
                <Popover open={tenantPickerOpen} onOpenChange={setTenantPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={tenantPickerOpen}
                      className={cn("mt-1.5 w-full justify-between font-normal", !createTenantId && "text-muted-foreground")}
                    >
                      {selectedTenant ? selectedTenant.name : "Search and select tenant"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tenants..." />
                      <CommandList>
                        <CommandEmpty>No tenant found.</CommandEmpty>
                        <CommandGroup>
                          {tenants.map((t) => (
                            <CommandItem
                              key={t.id}
                              value={`${t.name} ${t.id}`}
                              onSelect={() => {
                                setCreateTenantId(t.id);
                                setTenantPickerOpen(false);
                              }}
                            >
                              {t.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Username</Label>
                <Input value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} required className="mt-1.5" autoComplete="off" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={6} className="mt-1.5" autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full">
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Username</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {owners.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                  No owners found.
                </td>
              </tr>
            )}
            {owners.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{u.username}</td>
                <td className="p-4 text-sm text-muted-foreground">
                  {u.tenantName ?? (u.tenantId ? tenants.find((t) => t.id === u.tenantId)?.name ?? u.tenantId : "—")}
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      u.active !== false ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {u.active !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                    <HiOutlinePencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(u.id)}>
                    <HiOutlineTrash className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>New password (optional)</Label>
              <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={6} className="mt-1.5" placeholder="Leave blank to keep current" autoComplete="new-password" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="owner-active">Active</Label>
              <Switch id="owner-active" checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
