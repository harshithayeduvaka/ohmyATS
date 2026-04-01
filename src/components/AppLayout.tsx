import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header className="flex h-12 items-center gap-2 border-b border-border px-4 md:hidden">
        <SidebarTrigger />
        <span className="text-sm font-bold text-foreground">oh my ATS</span>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </SidebarInset>
  </SidebarProvider>
);

export default AppLayout;
