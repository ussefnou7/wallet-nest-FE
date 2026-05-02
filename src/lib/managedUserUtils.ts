import type { ManagedUser } from "@/lib/types";

export const extractList = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.results)) return obj.results;
  if (Array.isArray(obj.content)) return obj.content;
  return [];
};

export const normalizeUser = (item: unknown): ManagedUser | null => {
  const value = item as Record<string, unknown>;
  const username = value.username ?? value.userName;
  if (!username) return null;
  const id = value.id;
  if (!id) return null;
  return {
    id: String(id),
    username: String(username),
    role: value.role as ManagedUser["role"],
    tenantId: value.tenantId ? String(value.tenantId) : undefined,
    tenantName: value.tenantName != null && value.tenantName !== "" ? String(value.tenantName) : undefined,
    branchId: value.branchId ? String(value.branchId) : undefined,
    branchName: value.branchName != null && value.branchName !== "" ? String(value.branchName) : undefined,
    active: typeof value.active === "boolean" ? value.active : undefined,
    createdAt: value.createdAt ? String(value.createdAt) : undefined,
    updatedAt: value.updatedAt ? String(value.updatedAt) : undefined,
  };
};
