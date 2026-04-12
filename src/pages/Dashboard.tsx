import { Link } from "react-router-dom";
import { Search, FileText, MessageSquare, HelpCircle, History, FileSearch, Zap, Mail, Linkedin, ClipboardList, Building2, Mic, ArrowRight, Shield } from "lucide-react";
import logoImg from "@/assets/logo.png";

const tools = [
  { title: "Scan My Resume", description: "Analyse your resume against job descriptions for higher match rates.", icon: Search, href: "/scan", featured: true },
  { title: "Job Tracker", description: "Track all your applications, follow-ups, and interview stages in one place.", icon: ClipboardList, href: "/tracker", featured: true },
  { title: "Cover Letter Generator", description: "Create tailored, compelling cover letters in seconds with AI.", icon: FileText, href: "/cover-letter" },
  { title: "Interview Simulator", description: "Practice with real-time feedback and boost your confidence.", icon: MessageSquare, href: "/interview" },
  { title: "Interview Q&A Bank", description: "Get likely interview questions with suggested answers.", icon: HelpCircle, href: "/interview-qa" },
  { title: "Resume Versions", description: "Save multiple CV versions and track score improvements.", icon: History, href: "/versions" },
  { title: "JD Optimiser", description: "Optimise job descriptions for ATS screening.", icon: FileSearch, href: "/jd-optimizer" },
  { title: "Keyword Analyser", description: "Extract ATS keywords from any job description.", icon: Zap, href: "/keywords" },
  { title: "Cold Outreach", description: "Generate personalised cold emails & LinkedIn messages.", icon: Mail, href: "/cold-outreach" },
  { title: "LinkedIn Coach", description: "Analyse & optimise your LinkedIn profile.", icon: Linkedin, href: "/linkedin" },
  { title: "Elevator Pitch", description: "Generate a compelling pitch from your CV in seconds.", icon: Mic, href: "/elevator-pitch" },
  { title: "Company Contacts", description: "Store company details, contacts & LinkedIn profiles.", icon: Building2, href: "/contacts" },
];

const Dashboard = () => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    {/* Decorative blobs */}
    <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/5 animate-blob blur-3xl pointer-events-none" />
    <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] rounded-full bg-accent/5 animate-blob blur-3xl pointer-events-none" style={{ animationDelay: "2s" }} />

    <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 relative z-10">
      {/* Hero */}
      <div className="mb-14 animate-slide-up">
        <img src={logoImg} alt="oh my ATS" className="w-[140px] object-contain bg-transparent dark:invert mb-5" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          <span className="text-foreground">Match your resume to any</span>
          <br />
          <span className="gradient-text">job description in seconds.</span>
        </h1>
        <p className="mt-3 text-base text-muted-foreground/80 max-w-lg leading-relaxed">
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

      {/* Bento Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(140px,auto)]">
        {tools.map((tool, i) => (
          <Link
            key={tool.href}
            to={tool.href}
            className={`group relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-primary/20 animate-slide-up ${
              tool.featured
                ? "sm:col-span-2 p-7"
                : "p-5"
            }`}
            style={{
              animationDelay: `${80 + i * 50}ms`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            {/* Icon */}
            <div className={`rounded-xl gradient-bg-soft flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] ${
              tool.featured ? "w-12 h-12" : "w-10 h-10"
            }`}>
              <tool.icon className={`text-primary ${tool.featured ? "w-6 h-6" : "w-5 h-5"}`} />
            </div>

            <h3 className={`text-foreground flex items-center gap-2 font-bold ${
              tool.featured ? "text-lg mb-1.5" : "text-base mb-1"
            }`}>
              {tool.title}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </h3>
            <p className={`text-foreground/60 leading-relaxed ${
              tool.featured ? "text-sm max-w-md" : "text-[13px]"
            }`}>
              {tool.description}
            </p>

            {/* Featured badge */}
            {tool.featured && (
              <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase text-primary/60 bg-primary/5 px-2.5 py-1 rounded-full">
                Popular
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  </div>
);

export default Dashboard;
