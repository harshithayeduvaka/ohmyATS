import { Link } from "react-router-dom";
import { Search, FileText, MessageSquare, HelpCircle, History, FileSearch, Zap, Mail, Linkedin, ClipboardList, Building2, Mic, ArrowRight, Shield } from "lucide-react";
import logoImg from "@/assets/logo.png";

const tools = [
  { title: "Scan My Resume Now", description: "Analyse your resume against job descriptions for higher match rates.", icon: Search, href: "/scan" },
  { title: "Cover Letter Generator", description: "Create tailored, compelling cover letters in seconds with AI.", icon: FileText, href: "/cover-letter" },
  { title: "Interview Simulator", description: "Practice with real-time feedback and boost your confidence.", icon: MessageSquare, href: "/interview" },
  { title: "Interview Q&A Bank", description: "Get likely interview questions with suggested answers.", icon: HelpCircle, href: "/interview-qa" },
  { title: "Resume Versions", description: "Save multiple CV versions and track score improvements.", icon: History, href: "/versions" },
  { title: "JD Optimiser", description: "Optimise job descriptions for ATS screening.", icon: FileSearch, href: "/jd-optimizer" },
  { title: "Keyword Analyser", description: "Extract ATS keywords from any job description.", icon: Zap, href: "/keywords" },
  { title: "Cold Outreach", description: "Generate personalised cold emails & LinkedIn messages.", icon: Mail, href: "/cold-outreach" },
  { title: "LinkedIn Coach", description: "Analyse & optimise your LinkedIn profile.", icon: Linkedin, href: "/linkedin" },
  { title: "Elevator Pitch", description: "Generate a compelling pitch from your CV in seconds.", icon: Mic, href: "/elevator-pitch" },
  { title: "Job Tracker", description: "Track all your applications and follow-ups.", icon: ClipboardList, href: "/tracker" },
  { title: "Company Contacts", description: "Store company details, contacts & LinkedIn profiles.", icon: Building2, href: "/contacts" },
];

const Dashboard = () => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    {/* Decorative blobs */}
    <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/5 animate-blob blur-3xl pointer-events-none" />
    <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] rounded-full bg-accent/5 animate-blob blur-3xl pointer-events-none" style={{ animationDelay: "2s" }} />

    <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 relative z-10">
      <div className="mb-12 animate-slide-up">
        <img src={logoImg} alt="oh my ATS" className="w-[140px] object-contain bg-transparent dark:invert mb-5" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          <span className="text-foreground">Match your resume to any</span>
          <br />
          <span className="gradient-text">job description in seconds.</span>
        </h1>
        <p className="mt-3 text-base text-muted-foreground max-w-lg">
          Highly qualified but still getting the auto-reject email? Our ensemble AI engine scans your CV through dual models for maximum accuracy.
        </p>
        <div className="mt-7 flex gap-3">
          <Link
            to="/scan"
            className="inline-flex items-center px-7 py-3 rounded-full gradient-bg text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center px-7 py-3 rounded-full border border-border text-foreground font-medium text-sm hover:bg-secondary transition-colors duration-200"
          >
            About
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>GDPR compliant · End-to-end encrypted · Your data stays yours</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, i) => (
          <Link
            key={tool.href}
            to={tool.href}
            className="group relative p-5 rounded-2xl glass-card hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: `${80 + i * 50}ms` }}
          >
            <div className="w-10 h-10 rounded-xl gradient-bg-soft flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <tool.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base text-foreground mb-1 flex items-center gap-2 font-bold">
              {tool.title}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  </div>
);

export default Dashboard;
