import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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
                <Route path="/" element={<Dashboard />} />
                <Route path="/scan" element={<Index />} />
                <Route path="/cover-letter" element={<CoverLetter />} />
                <Route path="/interview" element={<InterviewSimulator />} />
                <Route path="/interview-qa" element={<InterviewQA />} />
                <Route path="/versions" element={<ResumeVersions />} />
                <Route path="/jd-optimizer" element={<JDOptimizer />} />
                <Route path="/keywords" element={<KeywordAnalyzer />} />
                <Route path="/cold-outreach" element={<ColdOutreach />} />
                <Route path="/linkedin" element={<LinkedInAnalyzer />} />
                <Route path="/tracker" element={<JobTracker />} />
                <Route path="/contacts" element={<CompanyContacts />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/elevator-pitch" element={<ElevatorPitch />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/support" element={<Support />} />
                <Route path="/about" element={<About />} />
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
