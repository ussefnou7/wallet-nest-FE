import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { extractList, normalizeUser } from "@/lib/managedUserUtils";
import type { ManagedUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from "react-icons/hi2";

export default function Users() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);
  const { toast } = useToast();

  const loadUsers = () =>
    api
      .get("/users")
      .then((r) => {
        const list = extractList(r.data)
          .map(normalizeUser)
          .filter((u): u is ManagedUser => u !== null);
        setUsers(list);
      })
      .catch(() => {});

  useEffect(() => {
    loadUsers();
  }, []);

  const resetCreate = () => {
    setCreateUsername("");
    setCreatePassword("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users", {
        username: createUsername,
        password: createPassword,
        role: "USER",
      });
      toast({ title: "User created" });
      setOpen(false);
      resetCreate();
      loadUsers();
    } catch {
      toast({ title: "Failed to create user", variant: "destructive" });
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
      toast({ title: "User updated" });
      setEditOpen(false);
      loadUsers();
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      toast({ title: "User deleted" });
      loadUsers();
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Users">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{users.length} user(s)</p>
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
              New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
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
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Role</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{u.username}</td>
                <td className="p-4 text-sm text-muted-foreground">{u.tenantName ?? "—"}</td>
                <td className="p-4 text-sm text-muted-foreground">{u.role ?? "—"}</td>
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
            <DialogTitle>Edit User</DialogTitle>
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
              <Label htmlFor="user-active">Active</Label>
              <Switch id="user-active" checked={editActive} onCheckedChange={setEditActive} />
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
