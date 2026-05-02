import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { TenantSubscription, Tenant, Plan } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TenantSubscription() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [currentSub, setCurrentSub] = useState<TenantSubscription | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const { toast } = useToast();

  const loadTenants = () => api.get("/tenants").then((r) => setTenants(r.data)).catch(() => {});
  const loadPlans = () => api.get("/plans").then((r) => setPlans(r.data)).catch(() => {});
  useEffect(() => { loadTenants(); loadPlans(); }, []);

  const loadCurrentSub = async (tenantId: string) => {
    try {
      const res = await api.get(`/tenant-subscriptions/tenants/${tenantId}`);
      setCurrentSub(res.data);
    } catch {
      setCurrentSub(null);
    }
  };

  const handleTenantChange = (value: string) => {
    setSelectedTenantId(value);
    loadCurrentSub(value);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/tenant-subscriptions/current", { tenantId, planId, startDate, expireDate });
      toast({ title: t("subscriptions.updated") });
      if (selectedTenantId === tenantId) loadCurrentSub(tenantId);
    } catch (err) {
      toast({ title: t("common.failed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("tabs.tenantSubscriptions")}>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("subscriptions.current")}</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label>{t("common.selectTenant")}</Label>
              <Select value={selectedTenantId} onValueChange={handleTenantChange}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder={t("common.selectTenant")} /></SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {currentSub ? (
              <div className="space-y-2">
                <div><strong>{t("common.tenantId")}:</strong> {currentSub.tenantId}</div>
                <div><strong>{t("subscriptions.planId")}:</strong> {currentSub.planId}</div>
                <div><strong>{t("common.startDate")}:</strong> {currentSub.startDate}</div>
                <div><strong>{t("common.expireDate")}:</strong> {currentSub.expireDate}</div>
              </div>
            ) : (
              <p>{t("subscriptions.noFound")}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("subscriptions.assignUpdate")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label>{t("common.tenant")}</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder={t("common.selectTenant")} /></SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("common.plan")}</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder={t("common.selectPlan")} /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("common.startDate")}</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1.5" /></div>
              <div><Label>{t("common.expireDate")}</Label><Input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} required className="mt-1.5" /></div>
              <Button type="submit">{t("subscriptions.update")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
