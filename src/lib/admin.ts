import api from "@/lib/api";
import type { SupportTicketResponse, RenewalRequestResponse } from "@/lib/types";

// Support Tickets API Functions
export const supportApi = {
  // GET /api/v1/admin/support/tickets
  getTickets: async (params?: {
    status?: string;
    tenantId?: string;
    priority?: string;
  }) => {
    return api.get<SupportTicketResponse[]>("/admin/support/tickets", { params });
  },

  // PATCH /api/v1/admin/support/tickets/{ticketId}/resolve
  resolveTicket: async (ticketId: string) => {
    return api.patch(`/admin/support/tickets/${ticketId}/resolve`);
  },
};

// Renewal Requests API Functions
export const renewalApi = {
  // GET /api/v1/admin/renewal-requests
  getRenewalRequests: async (params?: {
    status?: string;
    tenantId?: string;
  }) => {
    return api.get<RenewalRequestResponse[]>("/admin/renewal-requests", { params });
  },

  // PATCH /api/v1/admin/renewal-requests/{requestId}/approve
  approveRequest: async (requestId: string, adminNote?: string) => {
    return api.patch(`/admin/renewal-requests/${requestId}/approve`, {
      ...(adminNote && { adminNote }),
    });
  },

  // PATCH /api/v1/admin/renewal-requests/{requestId}/reject
  rejectRequest: async (requestId: string, adminNote?: string) => {
    return api.patch(`/admin/renewal-requests/${requestId}/reject`, {
      ...(adminNote && { adminNote }),
    });
  },
};
