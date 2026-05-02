import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      const description = getFriendlyErrorMessage(mapApiError(err));
      toast({ title: t("auth.loginFailed"), description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">{t("app.name")}</h1>
          <p className="text-muted-foreground mt-2">{t("auth.signInToAccount")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-8 rounded-xl border shadow-sm">
          <div>
            <Label htmlFor="username">{t("common.username")}</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">{t("common.password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.signInLoading") : t("auth.signIn")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.dontHaveAccount")} <Link to="/register" className="text-primary font-medium">{t("auth.register")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
