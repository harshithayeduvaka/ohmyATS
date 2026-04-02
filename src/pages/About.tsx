import { Info, Heart, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

const About = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <img src={logo} alt="oh my ATS" className="w-10 h-10 object-contain dark:invert" />
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
              Hey, I'm a student just like many of you, going through the whole job hunt grind. And honestly?
              I got really frustrated with how most ATS scanners work. They show you a score, make you feel
              like your CV isn't good enough, and then ask you to pay to "fix" it. But here's the thing:
              even after you pay, HRs on the other side are using completely different software to screen your application.
              Your "optimized" CV might not even matter.
            </p>
            <p>
              The truth is, every ATS system is different. What one flags, another ignores. There's no magic number
              that guarantees you'll get through. I felt like nobody was being honest about that, so I decided to
              build something that actually tries to help instead of just selling you false confidence.
            </p>
            <p>
              I've been studying how some of the popular ATS systems work and referencing their logic to make this
              tool as realistic as possible. It's not perfect yet, and I'm still actively improving it. But I
              wanted to give people something free and genuinely useful rather than another paywall dressed up
              as career advice.
            </p>
            <p>
              This is built <strong className="text-foreground">by a job seeker, for job seekers</strong>. No
              paywalls for basic features. No inflated scores. No dark patterns. Just honest, actionable feedback
              to help you land the role you deserve.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold text-foreground mb-3">Still Improving</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            This tool is a work in progress and I'm constantly tweaking the algorithms, adding new features,
            and trying to make the feedback more accurate. If you have suggestions, found a bug, or just want
            to tell me what you think, I'd genuinely love to hear from you.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <a
              href="mailto:yeduvakaharshitha@gmail.com"
              className="text-sm font-medium text-primary hover:underline"
            >
              yeduvakaharshitha@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default About;
