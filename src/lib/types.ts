export type Role = "SYSTEM_ADMIN" | "OWNER" | "USER";
export type TransactionType = "CREDIT" | "DEBIT";
export type WalletType = string;

export interface AuthResponse {
  token: string;
  username: string;
  role: Role;
}

export interface User {
  username: string;
  role: Role;
  token: string;
}

export interface Tenant {
  id: string;
  name: string;
  phoneNumber?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id?: string;
  name: string;
  active?: boolean;
  tenantId?: string;
  tenantName?: string;
  userCount?: number;
  walletCount?: number;
}

export interface Wallet {
  id: string;
  tenantId: string;
  tenantName?: string;
  name: string;
  balance: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  type: WalletType;
}

export interface ManagedUser {
  id: string;
  username: string;
  role?: Role;
  tenantId?: string;
  tenantName?: string;
  branchId?: string;
  branchName?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  walletId: string;
  walletName?: string;
  amount: number;
  type: TransactionType;
  percent?: number;
  fee?: number;
  description: string;
  phoneNumber?: string;
  createdByUsername?: string;
  /** Present when synced from an external system */
  externalTransactionId?: string;
  /** When the transaction occurred (may differ from createdAt) */
  occurredAt?: string;
  cash?: boolean;
  isCash?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceReport {
  walletId: string;
  walletName: string;
  balance: number;
}

export interface ProfitReport {
  tenantId: string;
  totalProfit: number;
}

export interface Plan {
  id?: string;
  name: string;
  description: string;
  maxUsers: number;
  maxWallets: number;
  maxBranches: number;
  active: boolean;
}

export interface TenantSubscription {
  tenantId: string;
  planId: string;
  startDate: string;
  expireDate: string;
}

export interface SupportTicketResponse {
  ticketId: string;
  tenantId: string;
  tenantName?: string;
  tenanName?: string;
  createdBy: string;
  createdByName?: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface RenewalRequestResponse {
  requestId: string;
  tenantId: string;
  tenantName?: string;
  requestedBy: string;
  requestedByName?: string;
  phoneNumber: string;
  amount: number;
  periodMonths: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  adminNote?: string;
}
