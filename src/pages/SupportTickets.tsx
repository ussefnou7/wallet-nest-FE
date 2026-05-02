import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { supportApi } from "@/lib/admin";
import type { SupportTicketResponse } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { HiOutlineCheck, HiOutlineFunnel } from "react-icons/hi2";

const truncate = (text: string, maxLength = 100) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

const statusBadgeVariant = (status: string) => {
  if (status === "OPEN") return "secondary";
  if (status === "RESOLVED") return "default";
  return "outline";
};

const priorityBadgeVariant = (priority: string) => {
  if (priority === "HIGH") return "destructive";
  if (priority === "MEDIUM") return "secondary";
  return "default";
};

export default function SupportTickets() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "OPEN" | "RESOLVED">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "LOW" | "MEDIUM" | "HIGH">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const loadTickets = async () => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;

      const response = await supportApi.getTickets(params);
      setTickets(response.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(mapApiError(err)));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const handleResolve = async (ticketId: string) => {
    try {
      await supportApi.resolveTicket(ticketId);
      toast({ title: t("supportTickets.resolvedSuccess") });
      loadTickets();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.supportTickets")}>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <HiOutlineFunnel className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "OPEN" | "RESOLVED")}> 
            <SelectTrigger className="w-40"><SelectValue placeholder={t("common.status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="OPEN">{t("supportTickets.statuses.open")}</SelectItem>
              <SelectItem value="RESOLVED">{t("supportTickets.statuses.resolved")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as "all" | "LOW" | "MEDIUM" | "HIGH")}> 
            <SelectTrigger className="w-40"><SelectValue placeholder={t("supportTickets.priorityLabel")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="LOW">{t("supportTickets.priorities.low")}</SelectItem>
              <SelectItem value="MEDIUM">{t("supportTickets.priorities.medium")}</SelectItem>
              <SelectItem value="HIGH">{t("supportTickets.priorities.high")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-destructive">{t("supportTickets.loadError", { message: error })}</div>
        ) : tickets.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{t("supportTickets.noFound")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("supportTickets.columns.subject")}</TableHead>
                <TableHead>{t("supportTickets.columns.description")}</TableHead>
                <TableHead>{t("common.tenant")}</TableHead>
                <TableHead>{t("supportTickets.createdBy")}</TableHead>
                <TableHead>{t("common.priority")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.createdAt")}</TableHead>
                <TableHead>{t("supportTickets.resolvedAt")}</TableHead>
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.ticketId}>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell title={ticket.description}>{truncate(ticket.description, 120)}</TableCell>
                  <TableCell>{ticket.tenantName || ticket.tenanName || "-"}</TableCell>
                  <TableCell>{ticket.createdByName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={priorityBadgeVariant(ticket.priority)}>{t(`supportTickets.priorities.${ticket.priority.toLowerCase()}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(ticket.status)}>{t(`supportTickets.statuses.${ticket.status.toLowerCase()}`)}</Badge>
                  </TableCell>
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-end">
                    {ticket.status === "OPEN" ? (
                      <Button size="sm" variant="outline" onClick={() => handleResolve(ticket.ticketId)}>
                        <HiOutlineCheck className="w-4 h-4 me-2" />
                        {t("supportTickets.resolve")}
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
}
