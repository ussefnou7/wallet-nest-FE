import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Wallets from "@/pages/Wallets";
import Transactions from "@/pages/Transactions";
import Tenants from "@/pages/Tenants";
import Branches from "@/pages/Branches";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";
import Owners from "@/pages/Owners";
import Plans from "@/pages/Plans";
import PlanDetails from "@/pages/PlanDetails";
import TenantSubscription from "@/pages/TenantSubscription";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/tenants" element={<ProtectedRoute roles={["SYSTEM_ADMIN"]}><Tenants /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute roles={["SYSTEM_ADMIN", "OWNER"]}><Branches /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute roles={["SYSTEM_ADMIN", "OWNER"]}><Reports /></ProtectedRoute>} />
            <Route path="/owners" element={<ProtectedRoute roles={["SYSTEM_ADMIN"]}><Owners /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute roles={["SYSTEM_ADMIN", "OWNER"]}><Users /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute roles={["SYSTEM_ADMIN"]}><Plans /></ProtectedRoute>} />
            <Route path="/plans/:id" element={<ProtectedRoute roles={["SYSTEM_ADMIN"]}><PlanDetails /></ProtectedRoute>} />
            <Route path="/tenant-subscriptions" element={<ProtectedRoute roles={["SYSTEM_ADMIN"]}><TenantSubscription /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
