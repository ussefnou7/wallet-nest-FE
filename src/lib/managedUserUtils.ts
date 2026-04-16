import type { ManagedUser } from "@/lib/types";

export const extractList = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.items)) return obj.items;
  return [];
};

export const normalizeUser = (item: unknown): ManagedUser | null => {
  const value = item as Record<string, unknown>;
  const username = value.username ?? value.userName;
  if (!username) return null;
  const id = value.id ?? value.userId ?? value.uuid ?? username;
  return {
    id: String(id),
    username: String(username),
    role: value.role as ManagedUser["role"],
    tenantId: value.tenantId ? String(value.tenantId) : undefined,
    tenantName: value.tenantName != null && value.tenantName !== "" ? String(value.tenantName) : undefined,
    active: typeof value.active === "boolean" ? value.active : undefined,
    createdAt: value.createdAt ? String(value.createdAt) : undefined,
    updatedAt: value.updatedAt ? String(value.updatedAt) : undefined,
  };
};
