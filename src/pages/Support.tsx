import { MessageCircle, Mail, ExternalLink } from "lucide-react";

const Support = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Support</h1>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold text-foreground mb-2">Need Help?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you're experiencing issues with any of the tools or have feature requests, feel free to reach out.
            We're building this platform to genuinely help job seekers — your feedback matters.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold text-foreground mb-3">FAQs</h2>
          <div className="space-y-4">
            {[
              { q: "Is oh my ATS free?", a: "Yes, all core tools are free to use. We believe job seekers shouldn't have to pay just to get past an ATS." },
              { q: "How accurate is the ATS scan?", a: "We reference multiple ATS systems (Bullhorn, Jobscan, etc.) to give you a comprehensive analysis. No single scanner is perfect, which is exactly why we built this." },
              { q: "Can I use this for French/EU job markets?", a: "Absolutely. All AI tools support English and French output and follow France/EU professional standards." },
              { q: "Is my data safe?", a: "Your data is stored securely and only accessible to you. We never share or sell your information." },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium text-foreground">{faq.q}</h3>
                <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Support;
