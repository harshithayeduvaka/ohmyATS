import { Link } from "react-router-dom";
import { FileText, MessageSquare, History, HelpCircle, Zap, ArrowRight, Search, FileSearch, Mail, Linkedin, ClipboardList, Building2 } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";

const tools = [
  {
    title: "ATS Scanner",
    description: "Run a production-grade ATS + recruiter dual scan on your CV against any job description.",
    icon: Zap,
    href: "/scan",
    color: "text-technical",
    bgColor: "bg-technical/10",
  },
  {
    title: "Cover Letter Generator",
    description: "AI-generates a tailored cover letter matching your CV to the target JD.",
    icon: FileText,
    href: "/cover-letter",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Interview Simulator",
    description: "Practice with AI-generated interview questions. Get your answers evaluated in real-time.",
    icon: MessageSquare,
    href: "/interview",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Interview Q&A Bank",
    description: "Paste a JD, select a role, and get likely interview questions with suggested answers from your CV.",
    icon: HelpCircle,
    href: "/interview-qa",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    title: "Resume Version History",
    description: "Save multiple CV versions, track score changes over time, and compare improvements.",
    icon: History,
    href: "/versions",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "JD Optimizer",
    description: "Paste a job description and get it optimized for ATS screening with hidden requirement analysis.",
    icon: FileSearch,
    href: "/jd-optimizer",
    color: "text-technical",
    bgColor: "bg-technical/10",
  },
  {
    title: "Keyword Analyzer",
    description: "Extract and categorize all ATS keywords from any job description. Copy them into your CV.",
    icon: Search,
    href: "/keywords",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Cold Outreach Generator",
    description: "Generate personalized cold emails & LinkedIn messages to hiring managers and recruiters.",
    icon: Mail,
    href: "/cold-outreach",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "LinkedIn Coach",
    description: "Get your LinkedIn profile analyzed, scored, and optimized with content strategy & SSI coaching.",
    icon: Linkedin,
    href: "/linkedin",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Job Application Tracker",
    description: "Track all your applications, statuses, contacts, and follow-ups in one organized place.",
    icon: ClipboardList,
    href: "/tracker",
    color: "text-technical",
    bgColor: "bg-technical/10",
  },
  {
    title: "Company Contacts",
    description: "Store company details, CEO, marketing head, HR head with their emails & LinkedIn profiles.",
    icon: Building2,
    href: "/contacts",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">ATS Intelligence</h1>
          <p className="text-sm text-muted-foreground">Your AI-powered job search ecosystem</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              to={tool.href}
              className="group p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${tool.bgColor} flex items-center justify-center shrink-0`}>
                  <tool.icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{tool.title}</h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{tool.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
