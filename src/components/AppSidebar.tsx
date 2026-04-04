import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  Home, Search, FileText, MessageSquare, HelpCircle, History,
  FileSearch, Zap, Mail, Linkedin, ClipboardList, Building2,
  StickyNote, Globe, Mic, User, MessageCircle,
  Info, Sparkles
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge,
  SidebarSeparator, useSidebar
} from "@/components/ui/sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import AuthButton from "@/components/AuthButton";

const mainNav = [
  { title: "Home", icon: Home, href: "/" },
  { title: "Job Tracker", icon: ClipboardList, href: "/tracker" },
  { title: "ATS Scanner", icon: Search, href: "/scan" },
  { title: "Resumes", icon: History, href: "/versions" },
  { title: "Notes", icon: StickyNote, href: "/notes", badge: "New" },
  { title: "Cold Outreach", icon: Mail, href: "/cold-outreach" },
  { title: "Portfolio", icon: Globe, href: "/portfolio", badge: "New" },
];

const aiTools = [
  { title: "Cover Letters", icon: FileText, href: "/cover-letter" },
  { title: "Interview Sim", icon: MessageSquare, href: "/interview" },
  { title: "Interview Q&A", icon: HelpCircle, href: "/interview-qa" },
  { title: "JD Optimizer", icon: FileSearch, href: "/jd-optimizer" },
  { title: "Keywords", icon: Zap, href: "/keywords" },
  { title: "LinkedIn Coach", icon: Linkedin, href: "/linkedin" },
  { title: "Elevator Pitch", icon: Mic, href: "/elevator-pitch" },
  { title: "Company Contacts", icon: Building2, href: "/contacts" },
];

const bottomNav = [
  { title: "About", icon: Info, href: "/about" },
  { title: "Profile", icon: User, href: "/profile" },
  { title: "Support", icon: MessageCircle, href: "/support" },
];

const AppSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderItem = (item: { title: string; icon: any; href: string; badge?: string }) => {
    const isActive = location.pathname === item.href;
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link to={item.href}>
            <item.icon className="w-4 h-4" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        </SidebarMenuButton>
        {item.badge && !collapsed && (
          <SidebarMenuBadge className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
            {item.badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/6033a818-06d5-4819-87e7-714d760d5ea0.png" alt="oh my ATS" className={`object-contain dark:invert ${collapsed ? "w-7 h-7" : "w-[120px]"}`} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{mainNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI TOOLS
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{aiTools.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{bottomNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`p-3 ${collapsed ? "flex flex-col items-center gap-2" : "flex flex-row items-center gap-2"}`}>
        <ThemeToggle />
        {!collapsed && <AuthButton />}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
