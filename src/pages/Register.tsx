import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";

export default function Register() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ username, password, email, role, tenantId: tenantId || undefined });
      navigate("/");
    } catch (err) {
      toast({ title: t("auth.registrationFailed"), description: getFriendlyErrorMessage(mapApiError(err)), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">{t("app.name")}</h1>
          <p className="text-muted-foreground mt-2">{t("auth.createYourAccount")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-8 rounded-xl border shadow-sm">
          <div>
            <Label htmlFor="username">{t("common.username")}</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">{t("common.password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5" />
          </div>
          <div>
            <Label>{t("common.role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{t("roles.USER")}</SelectItem>
                <SelectItem value="OWNER">{t("roles.OWNER")}</SelectItem>
                <SelectItem value="SYSTEM_ADMIN">{t("roles.SYSTEM_ADMIN")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tenantId">{t("auth.tenantIdOptional")}</Label>
            <Input id="tenantId" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder={t("auth.leaveEmptyToCreateNew")} className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.createAccountLoading") : t("auth.createAccount")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")} <Link to="/login" className="text-primary font-medium">{t("auth.signIn")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
