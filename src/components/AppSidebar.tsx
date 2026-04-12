import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  Home, Search, FileText, MessageSquare, HelpCircle, History,
  FileSearch, Zap, Mail, Linkedin, ClipboardList, Building2,
  StickyNote, Globe, Mic, User, MessageCircle,
  Info, Sparkles, Settings
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
  { title: "JD Optimiser", icon: FileSearch, href: "/jd-optimizer" },
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
        <SidebarMenuButton asChild isActive={false} tooltip={item.title}>
          <Link
            to={item.href}
            className={`relative transition-all duration-200 ${
              isActive
                ? "bg-primary/8 text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            } ${!collapsed ? "rounded-lg mx-1" : ""}`}
          >
            {/* Active pill indicator */}
            {isActive && !collapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
            )}
            {isActive && collapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-primary" />
            )}
            <item.icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? "text-primary" : ""}`} />
            {!collapsed && <span className="text-[13px]">{item.title}</span>}
          </Link>
        </SidebarMenuButton>
        {item.badge && !collapsed && (
          <SidebarMenuBadge className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 rounded-full">
            {item.badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar/80 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="oh my ATS" className={`object-contain bg-transparent dark:invert ${collapsed ? "w-7 h-7" : "w-[120px]"}`} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{mainNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="opacity-40" />

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="flex items-center gap-1.5 text-[11px] tracking-widest text-muted-foreground/60 font-medium uppercase">
              <Sparkles className="w-3 h-3" /> AI Tools
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{aiTools.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Distinct bottom section */}
      <SidebarFooter className="border-t border-border/30 pt-2">
        <SidebarMenu>
          {bottomNav.map(renderItem)}
        </SidebarMenu>
        <div className={`px-3 pb-3 pt-1 ${collapsed ? "flex flex-col items-center gap-2" : "flex flex-row items-center gap-2"}`}>
          <ThemeToggle />
          {!collapsed && <AuthButton />}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
