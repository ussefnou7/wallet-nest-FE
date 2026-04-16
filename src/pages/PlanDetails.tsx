import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function PlanDetails() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      api.get(`/plans/${id}`).then((r) => setPlan(r.data)).catch(() => navigate("/plans"));
    }
  }, [id, navigate]);

  if (!plan) return <DashboardLayout title="Plan Details"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout title="Plan Details">
      <Button variant="outline" onClick={() => navigate("/plans")} className="mb-4"><HiOutlineArrowLeft className="w-4 h-4 mr-2" />Back to Plans</Button>
      <Card>
        <CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><strong>Description:</strong> {plan.description}</div>
          <div><strong>Max Users:</strong> {plan.maxUsers}</div>
          <div><strong>Max Wallets:</strong> {plan.maxWallets}</div>
          <div><strong>Max Branches:</strong> {plan.maxBranches}</div>
          <div><strong>Active:</strong> {plan.active ? "Yes" : "No"}</div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}