import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import PageSeo from "@/components/PageSeo";
import Dashboard from "./pages/Dashboard.tsx";
import Index from "./pages/Index.tsx";
import CoverLetter from "./pages/CoverLetter.tsx";
import InterviewSimulator from "./pages/InterviewSimulator.tsx";
import InterviewQA from "./pages/InterviewQA.tsx";
import ResumeVersions from "./pages/ResumeVersions.tsx";
import JDOptimizer from "./pages/JDOptimizer.tsx";
import KeywordAnalyzer from "./pages/KeywordAnalyzer.tsx";
import ColdOutreach from "./pages/ColdOutreach.tsx";
import LinkedInAnalyzer from "./pages/LinkedInAnalyzer.tsx";
import JobTracker from "./pages/JobTracker.tsx";

import CompanyContacts from "./pages/CompanyContacts.tsx";
import Notes from "./pages/Notes.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import ElevatorPitch from "./pages/ElevatorPitch.tsx";
import Profile from "./pages/Profile.tsx";
import Support from "./pages/Support.tsx";
import About from "./pages/About.tsx";
import Privacy from "./pages/Privacy.tsx";
import DataProcessing from "./pages/DataProcessing.tsx";
import NotFound from "./pages/NotFound.tsx";
import Eval from "./pages/Eval.tsx";

const queryClient = new QueryClient();

type SeoMeta = { title: string; description: string };

const seo: Record<string, SeoMeta> = {
  "/": {
    title: "Made for ATS — AI CV Scanner & Job Tracker",
    description: "Optimise your CV for ATS screening and land more interviews with AI-powered CV analysis, cover letters, and job tracking.",
  },
  "/scan": {
    title: "ATS CV Scanner — Made for ATS",
    description: "Scan your CV against any job description and get a brutally honest ATS match score with section-by-section feedback.",
  },
  "/cover-letter": {
    title: "AI Cover Letter Generator — Made for ATS",
    description: "Generate tailored 3-paragraph cover letters in English or French, optimised for French and EU professional standards.",
  },
  "/interview": {
    title: "AI Interview Simulator — Made for ATS",
    description: "Practise interviews with an AI coach that evaluates your answers and gives feedback grounded in your CV and target role.",
  },
  "/interview-qa": {
    title: "Interview Q&A Prep — Made for ATS",
    description: "Get custom interview questions and model answers based on the company, sector, and interview type.",
  },
  "/versions": {
    title: "CV Version History — Made for ATS",
    description: "Track every iteration of your CV with automated AI saves and manual entries to compare changes over time.",
  },
  "/jd-optimizer": {
    title: "Job Description Optimiser — Made for ATS",
    description: "Refine job descriptions and surface the keywords, skills, and signals that drive ATS matching.",
  },
  "/keywords": {
    title: "Keyword Analyser — Made for ATS",
    description: "Identify trending and missing keywords between your CV and the target job description for stronger ATS scoring.",
  },
  "/cold-outreach": {
    title: "Cold Outreach Generator — Made for ATS",
    description: "Write warm, concise outreach messages that pitch your fit, value, and credibility in under 90 words.",
  },
  "/linkedin": {
    title: "LinkedIn Profile Coach — Made for ATS",
    description: "Audit your LinkedIn profile, estimate your SSI, and get copy-paste fixes for headline, About, and experience.",
  },
  "/tracker": {
    title: "Job Application Tracker — Made for ATS",
    description: "Track CDI, CDD, internship, and freelance applications across stages with a visual board built for job seekers.",
  },
  "/contacts": {
    title: "Company Contacts Directory — Made for ATS",
    description: "Manage CEOs, HR, and Marketing leads in a spreadsheet-style directory with bulk Excel import.",
  },
  "/notes": {
    title: "Job Search Notes — Made for ATS",
    description: "Capture company research, interview notes, and follow-up reminders in one organised workspace.",
  },
  "/portfolio": {
    title: "Portfolio Builder — Made for ATS",
    description: "Showcase your projects and case studies in a portfolio tailored to your target roles.",
  },
  "/elevator-pitch": {
    title: "Elevator Pitch Generator — Made for ATS",
    description: "Generate 30, 60, and 90-second elevator pitches grounded in your CV and target role.",
  },
  "/profile": {
    title: "Your Profile — Made for ATS",
    description: "Manage your account, CV, and preferences for the Made for ATS toolkit.",
  },
  "/support": {
    title: "Support — Made for ATS",
    description: "Get help with the Made for ATS toolkit, from CV scanning to interview prep.",
  },
  "/about": {
    title: "About — Made for ATS",
    description: "Made for ATS is an AI-powered job-search toolkit built for SKEMA Business School students and EU professionals.",
  },
  "/privacy": {
    title: "Privacy Policy — Made for ATS",
    description: "How Made for ATS collects, processes, and protects your CV and personal data under GDPR.",
  },
  "/data-processing": {
    title: "Data Processing — Made for ATS",
    description: "Technical and organisational measures, sub-processors, and security details for Made for ATS.",
  },
};

const Seo = ({ path }: { path: string }) => {
  const meta = seo[path];
  if (!meta) return null;
  return <PageSeo title={meta.title} description={meta.description} path={path} />;
};

const withSeo = (path: string, element: JSX.Element) => (
  <>
    <Seo path={path} />
    {element}
  </>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={withSeo("/", <Dashboard />)} />
                <Route path="/scan" element={withSeo("/scan", <Index />)} />
                <Route path="/cover-letter" element={withSeo("/cover-letter", <CoverLetter />)} />
                <Route path="/interview" element={withSeo("/interview", <InterviewSimulator />)} />
                <Route path="/interview-qa" element={withSeo("/interview-qa", <InterviewQA />)} />
                <Route path="/versions" element={withSeo("/versions", <ResumeVersions />)} />
                <Route path="/jd-optimizer" element={withSeo("/jd-optimizer", <JDOptimizer />)} />
                <Route path="/keywords" element={withSeo("/keywords", <KeywordAnalyzer />)} />
                <Route path="/cold-outreach" element={withSeo("/cold-outreach", <ColdOutreach />)} />
                <Route path="/linkedin" element={withSeo("/linkedin", <LinkedInAnalyzer />)} />
                <Route path="/tracker" element={withSeo("/tracker", <JobTracker />)} />

                <Route path="/contacts" element={withSeo("/contacts", <CompanyContacts />)} />
                <Route path="/notes" element={withSeo("/notes", <Notes />)} />
                <Route path="/portfolio" element={withSeo("/portfolio", <Portfolio />)} />
                <Route path="/elevator-pitch" element={withSeo("/elevator-pitch", <ElevatorPitch />)} />
                <Route path="/profile" element={withSeo("/profile", <Profile />)} />
                <Route path="/support" element={withSeo("/support", <Support />)} />
                <Route path="/about" element={withSeo("/about", <About />)} />
                <Route path="/privacy" element={withSeo("/privacy", <Privacy />)} />
                <Route path="/data-processing" element={withSeo("/data-processing", <DataProcessing />)} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
