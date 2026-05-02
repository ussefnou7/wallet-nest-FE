import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import type { Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function PlanDetails() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<Plan | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      api.get(`/plans/${id}`).then((r) => setPlan(r.data)).catch(() => navigate("/plans"));
    }
  }, [id, navigate]);

  if (!plan) return <DashboardLayout title={t("plans.detailsTitle")}><p>{t("common.loading")}</p></DashboardLayout>;

  return (
    <DashboardLayout title={t("plans.detailsTitle")}>
      <Button variant="outline" onClick={() => navigate("/plans")} className="mb-4"><HiOutlineArrowLeft className="w-4 h-4 me-2 rtl:rotate-180" />{t("common.backToPlans")}</Button>
      <Card>
        <CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><strong>{t("common.description")}:</strong> {plan.description}</div>
          <div><strong>{t("plans.maxUsers")}:</strong> {plan.maxUsers}</div>
          <div><strong>{t("plans.maxWallets")}:</strong> {plan.maxWallets}</div>
          <div><strong>{t("plans.maxBranches")}:</strong> {plan.maxBranches}</div>
          <div><strong>{t("common.active")}:</strong> {plan.active ? t("common.yes") : t("common.no")}</div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
