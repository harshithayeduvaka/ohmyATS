import { Link } from "react-router-dom";
import { FileText, MessageSquare, History, HelpCircle, Zap, Search, FileSearch, Mail, Linkedin, ClipboardList, Building2, ArrowRight } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";

const tools = [
  {
    title: "ATS Scanner",
    description: "Instantly analyze your resume against job descriptions for higher match rates.",
    icon: Search,
    href: "/scan",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    title: "Cover Letter Generator",
    description: "Create tailored, compelling cover letters in seconds with AI.",
    icon: FileText,
    href: "/cover-letter",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Interview Simulator",
    description: "Practice with real-time feedback and boost your confidence.",
    icon: MessageSquare,
    href: "/interview",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Interview Q&A Bank",
    description: "Get likely interview questions with suggested answers from your CV.",
    icon: HelpCircle,
    href: "/interview-qa",
    iconBg: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    title: "Resume Versions",
    description: "Save multiple CV versions, track scores, and compare improvements.",
    icon: History,
    href: "/versions",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "JD Optimizer",
    description: "Optimize any job description for ATS screening with hidden requirement analysis.",
    icon: FileSearch,
    href: "/jd-optimizer",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Keyword Analyzer",
    description: "Extract and categorize all ATS keywords from any job description.",
    icon: Zap,
    href: "/keywords",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Cold Outreach Generator",
    description: "Generate personalized cold emails & LinkedIn messages to hiring managers.",
    icon: Mail,
    href: "/cold-outreach",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    title: "LinkedIn Coach",
    description: "Analyze, optimize & get coaching for your LinkedIn profile with SSI scoring.",
    icon: Linkedin,
    href: "/linkedin",
    iconBg: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    title: "Job Application Tracker",
    description: "Track all your applications, statuses, contacts, and follow-ups.",
    icon: ClipboardList,
    href: "/tracker",
    iconBg: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    title: "Company Contacts",
    description: "Store company details, contacts, emails & LinkedIn profiles in one place.",
    icon: Building2,
    href: "/contacts",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,97%)] dark:bg-background">
      {/* Navigation */}
      <nav className="px-6 lg:px-12 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xl font-bold tracking-tight text-foreground">oh my ATS</span>
        <div className="hidden md:flex items-center gap-8">
          <a href="#tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tools</a>
          <span className="text-sm text-muted-foreground">Pricing</span>
          <span className="text-sm text-muted-foreground">About</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Think, plan, and land your dream job
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
              Your AI-powered ecosystem for smarter job searching, resume optimization, and interview preparation.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                to="/scan"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
              <a
                href="#tools"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
              >
                Watch Demo
              </a>
            </div>
          </div>
          <div className="hidden lg:flex justify-end">
            <div className="relative w-full max-w-md">
              <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 rotate-2 translate-x-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ATS Compatibility</span>
                    <span className="text-xs font-bold text-accent">92%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full"><div className="h-full w-[92%] bg-accent rounded-full" /></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Keyword Match</span>
                    <span className="text-xs font-bold text-warning">67%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full"><div className="h-full w-[67%] bg-warning rounded-full" /></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Recruiter Appeal</span>
                    <span className="text-xs font-bold text-accent">85%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full"><div className="h-full w-[85%] bg-accent rounded-full" /></div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-xl border border-border p-4 -rotate-3 w-48">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Match Found</span>
                </div>
                <p className="text-[10px] text-muted-foreground">3 critical keywords added successfully</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              to={tool.href}
              className="group p-6 rounded-2xl bg-card border border-border/60 hover:shadow-lg hover:border-border transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center mb-4`}>
                <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
                {tool.title}
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
