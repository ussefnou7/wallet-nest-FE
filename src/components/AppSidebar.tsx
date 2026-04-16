import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { HiOutlineHome, HiOutlineCreditCard, HiOutlineArrowsRightLeft, HiOutlineBuildingOffice2, HiOutlineBuildingStorefront, HiOutlineChartBar, HiOutlineUsers, HiOutlineUserGroup, HiOutlineArrowRightOnRectangle, HiOutlineDocumentText } from "react-icons/hi2";

const navItems = [
  { path: "/", label: "Dashboard", icon: HiOutlineHome, roles: ["SYSTEM_ADMIN", "OWNER", "USER"] },
  { path: "/wallets", label: "Wallets", icon: HiOutlineCreditCard, roles: ["SYSTEM_ADMIN", "OWNER", "USER"] },
  { path: "/transactions", label: "Transactions", icon: HiOutlineArrowsRightLeft, roles: ["SYSTEM_ADMIN", "OWNER", "USER"] },
  { path: "/tenants", label: "Tenants", icon: HiOutlineBuildingOffice2, roles: ["SYSTEM_ADMIN"] },
  { path: "/branches", label: "Branches", icon: HiOutlineBuildingStorefront, roles: ["SYSTEM_ADMIN", "OWNER"] },
  { path: "/reports", label: "Reports", icon: HiOutlineChartBar, roles: ["SYSTEM_ADMIN", "OWNER"] },
  { path: "/owners", label: "Owners", icon: HiOutlineUserGroup, roles: ["SYSTEM_ADMIN"] },
  { path: "/users", label: "Users", icon: HiOutlineUsers, roles: ["SYSTEM_ADMIN", "OWNER"] },
  { path: "/plans", label: "Plans", icon: HiOutlineDocumentText, roles: ["SYSTEM_ADMIN"] },
  { path: "/tenant-subscriptions", label: "Tenant Subscriptions", icon: HiOutlineDocumentText, roles: ["SYSTEM_ADMIN"] },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filtered = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="p-6">
        <h1 className="text-xl font-bold" style={{ color: "hsl(var(--sidebar-active))" }}>
          WalletFlow
        </h1>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--sidebar-fg))" }}>Transaction Manager</p>
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
              {item.label}
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
            <p className="text-xs" style={{ color: "hsl(var(--sidebar-fg))" }}>{user?.role}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg transition-colors" style={{ color: "hsl(var(--sidebar-fg))" }} title="Logout">
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
