import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";
import { HiOutlineHome, HiOutlineCreditCard, HiOutlineArrowsRightLeft, HiOutlineBuildingOffice2, HiOutlineBuildingStorefront, HiOutlineChartBar, HiOutlineUsers, HiOutlineUserGroup, HiOutlineArrowRightOnRectangle, HiOutlineDocumentText } from "react-icons/hi2";

const navItems = [
  { path: "/", labelKey: "tabs.dashboard", icon: HiOutlineHome, roles: ["SYSTEM_ADMIN", "OWNER", "USER"] },
  { path: "/wallets", labelKey: "tabs.wallets", icon: HiOutlineCreditCard, roles: ["SYSTEM_ADMIN", "OWNER", "USER"] },
  { path: "/transactions", labelKey: "tabs.transactions", icon: HiOutlineArrowsRightLeft, roles: ["SYSTEM_ADMIN", "OWNER", "USER"] },
  { path: "/tenants", labelKey: "tabs.tenants", icon: HiOutlineBuildingOffice2, roles: ["SYSTEM_ADMIN"] },
  { path: "/support-tickets", labelKey: "tabs.supportTickets", icon: HiOutlineDocumentText, roles: ["SYSTEM_ADMIN"] },
  { path: "/renewal-requests", labelKey: "tabs.renewalRequests", icon: HiOutlineDocumentText, roles: ["SYSTEM_ADMIN"] },
  { path: "/branches", labelKey: "tabs.branches", icon: HiOutlineBuildingStorefront, roles: ["SYSTEM_ADMIN", "OWNER"] },
  { path: "/reports", labelKey: "tabs.reports", icon: HiOutlineChartBar, roles: ["SYSTEM_ADMIN", "OWNER"] },
  { path: "/owners", labelKey: "tabs.owners", icon: HiOutlineUserGroup, roles: ["SYSTEM_ADMIN"] },
  { path: "/users", labelKey: "tabs.users", icon: HiOutlineUsers, roles: ["SYSTEM_ADMIN", "OWNER"] },
  { path: "/plans", labelKey: "tabs.plans", icon: HiOutlineDocumentText, roles: ["SYSTEM_ADMIN"] },
  { path: "/tenant-subscriptions", labelKey: "tabs.tenantSubscriptions", icon: HiOutlineDocumentText, roles: ["SYSTEM_ADMIN"] },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const filtered = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="fixed inset-y-0 start-0 h-screen w-64 flex flex-col" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="flex items-start justify-between gap-3 p-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(var(--sidebar-active))" }}>
            {t("app.name")}
          </h1>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--sidebar-fg))" }}>{t("app.tagline")}</p>
        </div>
        <LanguageToggle />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {filtered.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? "hsl(var(--sidebar-hover))" : "transparent",
                color: active ? "hsl(var(--sidebar-active))" : "hsl(var(--sidebar-fg))",
              }}
            >
              <item.icon className="w-5 h-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: "hsl(var(--sidebar-hover))" }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold" style={{ color: "hsl(0,0%,100%)" }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--sidebar-active-fg))" }}>{user?.username}</p>
            <p className="text-xs" style={{ color: "hsl(var(--sidebar-fg))" }}>{user?.role ? t(`roles.${user.role}`) : ""}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg transition-colors" style={{ color: "hsl(var(--sidebar-fg))" }} title={t("common.logout")}>
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
