import { FileText } from "lucide-react";

const DataProcessing = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Data Processing Addendum</h1>
      </div>

      <article className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm text-foreground leading-relaxed">
        <p className="text-muted-foreground">
          This addendum forms part of our Privacy Policy and describes the technical and
          organisational measures we apply when processing personal data on your behalf.
        </p>

        <section>
          <h2 className="text-base font-semibold uppercase tracking-wide mt-6">Roles</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Data controller:</strong> you — the user uploading CV and JD content.</li>
            <li><strong>Data processor:</strong> Made for ATS, acting on your documented instructions (the act of scanning).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold uppercase tracking-wide mt-6">Sub-processors</h2>
          <table className="w-full text-xs border border-border rounded-md mt-2">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Sub-processor</th>
                <th className="text-left p-2">Purpose</th>
                <th className="text-left p-2">Region</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border"><td className="p-2">Supabase (Lovable Cloud)</td><td className="p-2">Database, auth, storage</td><td className="p-2">EU (Frankfurt)</td></tr>
              <tr className="border-t border-border"><td className="p-2">Google (Gemini)</td><td className="p-2">CV analysis LLM</td><td className="p-2">EU / US</td></tr>
              <tr className="border-t border-border"><td className="p-2">OpenAI (GPT)</td><td className="p-2">CV analysis LLM</td><td className="p-2">EU / US</td></tr>
              <tr className="border-t border-border"><td className="p-2">Lovable AI Gateway</td><td className="p-2">Routing and aggregation</td><td className="p-2">EU</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-semibold uppercase tracking-wide mt-6">Technical measures</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>TLS 1.2+ for all traffic; encryption at rest for the database.</li>
            <li>Row-level security enforced on every user-scoped table.</li>
            <li>Service-role keys held only in the backend, never exposed to the client.</li>
            <li>Automated 90-day retention for unsaved scan history.</li>
            <li>Have I Been Pwned password check at signup and password change.</li>
            <li>Principle of least privilege on database functions (SECURITY DEFINER with explicit search_path).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold uppercase tracking-wide mt-6">Breach notification</h2>
          <p>
            In the event of a personal data breach, we will notify affected users without undue
            delay and within 72 hours of becoming aware, as required by GDPR Art. 33.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold uppercase tracking-wide mt-6">International transfers</h2>
          <p>
            Where data is processed outside the EEA (e.g. by US-based LLM providers), transfers
            rely on the EU Standard Contractual Clauses or equivalent adequacy mechanisms.
          </p>
        </section>
      </article>
    </div>
  </div>
);

export default DataProcessing;
