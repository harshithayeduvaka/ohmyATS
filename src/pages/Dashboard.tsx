import { Link } from "react-router-dom";
import { Search, FileText, MessageSquare, HelpCircle, History, FileSearch, Zap, Mail, Linkedin, ClipboardList, Building2, Mic, ArrowRight } from "lucide-react";
import logoImg from "@/assets/logo.png";

const tools = [
  { title: "ATS Scanner", description: "Analyze your resume against job descriptions for higher match rates.", icon: Search, href: "/scan", iconBg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400" },
  { title: "Cover Letter Generator", description: "Create tailored, compelling cover letters in seconds with AI.", icon: FileText, href: "/cover-letter", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { title: "Interview Simulator", description: "Practice with real-time feedback and boost your confidence.", icon: MessageSquare, href: "/interview", iconBg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
  { title: "Interview Q&A Bank", description: "Get likely interview questions with suggested answers.", icon: HelpCircle, href: "/interview-qa", iconBg: "bg-rose-100 dark:bg-rose-900/30", iconColor: "text-rose-600 dark:text-rose-400" },
  { title: "Resume Versions", description: "Save multiple CV versions and track score improvements.", icon: History, href: "/versions", iconBg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
  { title: "JD Optimizer", description: "Optimize job descriptions for ATS screening.", icon: FileSearch, href: "/jd-optimizer", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { title: "Keyword Analyzer", description: "Extract ATS keywords from any job description.", icon: Zap, href: "/keywords", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", iconColor: "text-cyan-600 dark:text-cyan-400" },
  { title: "Cold Outreach", description: "Generate personalized cold emails & LinkedIn messages.", icon: Mail, href: "/cold-outreach", iconBg: "bg-orange-100 dark:bg-orange-900/30", iconColor: "text-orange-600 dark:text-orange-400" },
  { title: "LinkedIn Coach", description: "Analyze & optimize your LinkedIn profile.", icon: Linkedin, href: "/linkedin", iconBg: "bg-sky-100 dark:bg-sky-900/30", iconColor: "text-sky-600 dark:text-sky-400" },
  { title: "Elevator Pitch", description: "Generate a compelling pitch from your CV in seconds.", icon: Mic, href: "/elevator-pitch", iconBg: "bg-pink-100 dark:bg-pink-900/30", iconColor: "text-pink-600 dark:text-pink-400" },
  { title: "Job Tracker", description: "Track all your applications and follow-ups.", icon: ClipboardList, href: "/tracker", iconBg: "bg-teal-100 dark:bg-teal-900/30", iconColor: "text-teal-600 dark:text-teal-400" },
  { title: "Company Contacts", description: "Store company details, contacts & LinkedIn profiles.", icon: Building2, href: "/contacts", iconBg: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400" },
];

const Dashboard = () => (
  <div className="min-h-screen bg-background">
    <section className="max-w-6xl mx-auto px-6 pt-10 pb-16">
      <div className="mb-10">
        <img src={logoImg} alt="oh my ATS" className="w-[140px] object-contain dark:invert mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
          Think, plan, and land<br />your dream job
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg">
          Your AI-powered ecosystem for smarter job searching, resume optimization, and interview preparation.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/scan" className="inline-flex items-center px-6 py-2.5 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity">
            Get Started
          </Link>
          <Link to="/about" className="inline-flex items-center px-6 py-2.5 rounded-full border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors">
            About
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} to={tool.href} className="group p-5 rounded-2xl bg-card border border-border/60 hover:shadow-lg hover:border-border transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl ${tool.iconBg} flex items-center justify-center mb-3`}>
              <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              {tool.title}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  </div>
);

export default Dashboard;
