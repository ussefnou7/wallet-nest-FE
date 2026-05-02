import AppSidebar from "./AppSidebar";

export default function DashboardLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ms-64 p-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
