import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center border-b border-border px-3 shrink-0">
          <SidebarTrigger className="mr-2" />
          <span className="text-sm font-semibold text-foreground md:hidden">oh my ATS</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);

export default AppLayout;
