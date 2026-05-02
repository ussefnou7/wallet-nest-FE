import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { extractList, normalizeUser } from "@/lib/managedUserUtils";
import type { ManagedUser, Branch } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineBuildingStorefront, HiOutlineXMark } from "react-icons/hi2";

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<ManagedUser | null>(null);
  const [assignBranchId, setAssignBranchId] = useState("");
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

  const normalizeBranches = (raw: unknown): Branch[] =>
    extractList(raw)
      .map((item) => {
        const value = item as Record<string, unknown>;
        const id = value.id ?? value.branchId ?? value.uuid;
        const name = value.name ?? value.branchName;
        return {
          id: id ? String(id) : undefined,
          name: name ? String(name) : "",
        } as Branch;
      })
      .filter((branch) => branch.id && branch.name);

  const loadBranches = () =>
    api
      .get("/branches")
      .then((r) => setBranches(normalizeBranches(r.data)))
      .catch(() => setBranches([]));

  useEffect(() => {
    loadUsers();
    loadBranches();
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
      toast({ title: t("users.created") });
      setOpen(false);
      resetCreate();
      loadUsers();
    } catch (err) {
      toast({ title: t("users.failedCreate"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
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
      toast({ title: t("users.updated") });
      setEditOpen(false);
      loadUsers();
    } catch (err) {
      toast({ title: t("users.failedUpdate"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      toast({ title: t("users.deleted") });
      loadUsers();
    } catch (err) {
      toast({ title: t("users.failedDelete"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const openAssign = (user: ManagedUser) => {
    setAssignUser(user);
    setAssignBranchId(user.branchId ?? "");
    setAssignOpen(true);
    if (branches.length === 0) loadBranches();
  };

  const resetAssign = () => {
    setAssignUser(null);
    setAssignBranchId("");
  };

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUser?.id || !assignBranchId) {
      toast({ title: t("users.assignBranchFailed"), variant: "destructive" });
      return;
    }
    try {
      await api.put(`/users/${assignUser.id}/assign-branch`, { branchId: assignBranchId });
      toast({ title: t("users.assignBranchSuccess") });
      setAssignOpen(false);
      resetAssign();
      loadUsers();
    } catch (err) {
      toast({ title: t("users.assignBranchFailed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  const handleUnassignBranch = async (id?: string) => {
    if (!id) {
      toast({ title: t("users.unassignBranchFailed"), variant: "destructive" });
      return;
    }
    try {
      await api.delete(`/users/${id}/assign-branch`);
      toast({ title: t("users.unassignBranchSuccess") });
      loadUsers();
    } catch (err) {
      toast({ title: t("users.unassignBranchFailed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.users")}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{t("users.count", { count: users.length })}</p>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetCreate();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <HiOutlinePlus className="w-4 h-4 me-2" />
              {t("users.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("users.createTitle")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>{t("common.username")}</Label>
                <Input value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} required className="mt-1.5" autoComplete="off" />
              </div>
              <div>
                <Label>{t("common.password")}</Label>
                <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={6} className="mt-1.5" autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.username")}</th>
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.tenant")}</th>
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.role")}</th>
              <th className="text-start text-xs font-medium text-muted-foreground p-4">{t("common.status")}</th>
              <th className="text-end text-xs font-medium text-muted-foreground p-4">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                  {t("users.noneFound")}
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium text-foreground">{u.username}</td>
                <td className="p-4 text-sm text-muted-foreground">{u.tenantName ?? "—"}</td>
                <td className="p-4 text-sm text-muted-foreground">{u.role ? t(`roles.${u.role}`) : "—"}</td>
                <td className="p-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      u.active !== false ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {u.active !== false ? t("common.active") : t("common.inactive")}
                  </span>
                </td>
                <td className="p-4 text-end flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                    <HiOutlinePencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssign(u)}
                    title={t("users.assignBranch")}
                    aria-label={t("users.assignBranch")}
                  >
                    <HiOutlineBuildingStorefront className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnassignBranch(u.id)}
                    title={t("users.unassignBranch")}
                    aria-label={t("users.unassignBranch")}
                  >
                    <HiOutlineXMark className="w-4 h-4" />
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
            <DialogTitle>{t("users.editTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>{t("common.username")}</Label>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>{t("common.newPasswordOptional")}</Label>
              <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={6} className="mt-1.5" placeholder={t("auth.leaveEmptyToCreateNew")} autoComplete="new-password" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="user-active">{t("common.active")}</Label>
              <Switch id="user-active" checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <Button type="submit" className="w-full">
              {t("common.save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assignOpen}
        onOpenChange={(v) => {
          setAssignOpen(v);
          if (!v) resetAssign();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.assignBranchTitle", { username: assignUser?.username })}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignBranch} className="space-y-4">
            <div>
              <Label>{t("tabs.branches")}</Label>
              <Select value={assignBranchId} onValueChange={setAssignBranchId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t("common.selectBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id!}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={!assignBranchId}>
              {t("users.assignBranch")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
