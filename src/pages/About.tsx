import { Info, Heart } from "lucide-react";

const About = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Info className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">About oh my ATS</h1>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-destructive" />
            <h2 className="font-semibold text-foreground">Why I Built This</h2>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              I'm a student myself, currently hunting for jobs — and I'm <strong className="text-foreground">sick of fake CV scores</strong> that
              only exist to push you into making a purchase. Come on. No matter what score you get, HRs use completely
              different professional software on their end. Even if you paid to "beat the ATS," recruiters are running
              your CV through systems you've never even heard of.
            </p>
            <p>
              I personally believe <strong className="text-foreground">every ATS scanner varies</strong>, and the criteria
              changes for every software. What Jobscan flags, Bullhorn might ignore. What Resume Worded highlights,
              Lever doesn't even check. There's no single "perfect score" — that's the uncomfortable truth nobody
              tells you before asking for your credit card.
            </p>
            <p>
              So I tried putting all my efforts into building something that actually helps. I referenced
              <strong className="text-foreground"> Bullhorn, Jobscan, Resume Worded, Lever, Greenhouse</strong> and
              other widely-used ATS systems to create a scanner that gives you a <em>realistic, multi-perspective</em> analysis —
              not just a number designed to make you feel bad enough to pay.
            </p>
            <p>
              This tool is built <strong className="text-foreground">by a job seeker, for job seekers</strong>. No
              paywalls for basic features. No inflated scores. No dark patterns. Just honest, actionable feedback
              to help you land the role you deserve.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold text-foreground mb-3">What We Reference</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["Bullhorn", "Jobscan", "Resume Worded", "Lever", "Greenhouse", "Workday", "iCIMS", "Taleo", "SmartRecruiters"].map((name) => (
              <div key={name} className="px-3 py-2 rounded-lg bg-muted text-center">
                <span className="text-sm font-medium text-foreground">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            We study how these systems parse, score, and filter CVs to give you the most comprehensive analysis possible.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default About;
