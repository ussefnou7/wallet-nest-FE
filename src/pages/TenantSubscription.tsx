import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { TenantSubscription, Tenant, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TenantSubscription() {
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
      toast({ title: "Subscription updated" });
      if (selectedTenantId === tenantId) loadCurrentSub(tenantId);
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Tenant Subscription">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>View Current Subscription</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label>Select Tenant</Label>
              <Select value={selectedTenantId} onValueChange={handleTenantChange}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {currentSub ? (
              <div className="space-y-2">
                <div><strong>Tenant ID:</strong> {currentSub.tenantId}</div>
                <div><strong>Plan ID:</strong> {currentSub.planId}</div>
                <div><strong>Start Date:</strong> {currentSub.startDate}</div>
                <div><strong>Expire Date:</strong> {currentSub.expireDate}</div>
              </div>
            ) : (
              <p>No subscription found.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Assign / Update Subscription</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label>Tenant</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1.5" /></div>
              <div><Label>Expire Date</Label><Input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} required className="mt-1.5" /></div>
              <Button type="submit">Update Subscription</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}