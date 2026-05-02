import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { renewalApi } from "@/lib/admin";
import type { RenewalRequestResponse } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { HiOutlineFunnel } from "react-icons/hi2";

const statusBadgeVariant = (status: string) => {
  if (status === "PENDING") return "secondary";
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "outline";
};

export default function RenewalRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RenewalRequestResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const response = await renewalApi.getRenewalRequests(params);
      setRequests(response.data);
    } catch (err) {
      setRequests([]);
      setError(getFriendlyErrorMessage(mapApiError(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    const adminNote = window.prompt(t("renewalRequests.adminNotePrompt"));
    try {
      if (action === "approve") {
        await renewalApi.approveRequest(requestId, adminNote ?? undefined);
        toast({ title: t("renewalRequests.approvedSuccess") });
      } else {
        await renewalApi.rejectRequest(requestId, adminNote ?? undefined);
        toast({ title: t("renewalRequests.rejectedSuccess") });
      }
      loadRequests();
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.renewalRequests")}>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <HiOutlineFunnel className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "PENDING" | "APPROVED" | "REJECTED")}> 
            <SelectTrigger className="w-48"><SelectValue placeholder={t("common.status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="PENDING">{t("renewalRequests.statuses.pending")}</SelectItem>
              <SelectItem value="APPROVED">{t("renewalRequests.statuses.approved")}</SelectItem>
              <SelectItem value="REJECTED">{t("renewalRequests.statuses.rejected")}</SelectItem>
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
          <div className="p-6 text-sm text-destructive">{t("renewalRequests.loadError", { message: error })}</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{t("renewalRequests.noFound")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("renewalRequests.columns.phoneNumber")}</TableHead>
                <TableHead>{t("renewalRequests.columns.amount")}</TableHead>
                <TableHead>{t("renewalRequests.columns.periodMonths")}</TableHead>
                <TableHead>{t("common.tenant")}</TableHead>
                <TableHead>{t("renewalRequests.columns.requestedBy")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.createdAt")}</TableHead>
                <TableHead>{t("renewalRequests.reviewedAt")}</TableHead>
                <TableHead>{t("renewalRequests.reviewedBy")}</TableHead>
                <TableHead>{t("renewalRequests.columns.adminNote")}</TableHead>
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.requestId}>
                  <TableCell>{request.phoneNumber}</TableCell>
                  <TableCell>{request.amount}</TableCell>
                  <TableCell>{request.periodMonths}</TableCell>
                  <TableCell>{request.tenantName || "-"}</TableCell>
                  <TableCell>{request.requestedByName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(request.status)}>{t(`renewalRequests.statuses.${request.status.toLowerCase()}`)}</Badge>
                  </TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{request.reviewedByName || "-"}</TableCell>
                  <TableCell>{request.adminNote || "-"}</TableCell>
                  <TableCell className="text-end">
                    {request.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAction(request.requestId, "approve")}>{t("renewalRequests.approve")}</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(request.requestId, "reject")}>{t("renewalRequests.reject")}</Button>
                      </div>
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
