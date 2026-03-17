import { ScanResult } from "@/lib/types";

export const generatePdfReport = (result: ScanResult) => {
  const { scores, botPass, algorithm, humanPass, rewrites, keywordAnalysis } = result;

  // Build HTML content for print/PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ATS Intelligence Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e0e0e0; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
    .scores { display: flex; gap: 16px; flex-wrap: wrap; margin: 12px 0; }
    .score-item { text-align: center; padding: 10px 14px; border: 1px solid #e0e0e0; border-radius: 8px; min-width: 100px; }
    .score-value { font-size: 24px; font-weight: 700; }
    .score-label { font-size: 10px; color: #666; text-transform: uppercase; }
    .overall { font-size: 32px; }
    .issue { padding: 6px 10px; background: #fff3cd; border-left: 3px solid #f0ad4e; margin: 4px 0; border-radius: 2px; }
    .field { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-family: monospace; font-size: 12px; }
    .matched { color: #28a745; } .missing { color: #dc3545; } .weak { color: #f0ad4e; }
    .rewrite { margin: 10px 0; padding: 12px; background: #f8f9fa; border-radius: 6px; }
    .before { color: #dc3545; } .after { color: #28a745; }
    .keyword-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; }
    .badge { font-size: 9px; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; font-weight: 600; }
    .badge-critical { background: #f8d7da; color: #dc3545; }
    .badge-high { background: #fff3cd; color: #856404; }
    .badge-medium { background: #d1ecf1; color: #0c5460; }
    .badge-low { background: #e2e3e5; color: #6c757d; }
    .found { color: #28a745; } .not-found { color: #dc3545; }
    ul { padding-left: 18px; }
    li { margin: 3px 0; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>ATS Intelligence Report</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

  <h2>Score Breakdown</h2>
  <div class="scores">
    <div class="score-item"><div class="score-value overall">${scores.overall}</div><div class="score-label">Overall</div></div>
    <div class="score-item"><div class="score-value">${scores.atsCompatibility}</div><div class="score-label">ATS Compat.</div></div>
    <div class="score-item"><div class="score-value">${scores.keywordMatch}</div><div class="score-label">Keywords</div></div>
    <div class="score-item"><div class="score-value">${scores.recruiterAppeal}</div><div class="score-label">Recruiter</div></div>
    <div class="score-item"><div class="score-value">${scores.impactClarity}</div><div class="score-label">Impact</div></div>
    <div class="score-item"><div class="score-value">${scores.formatScore}</div><div class="score-label">Format</div></div>
  </div>

  <h2>Bot Pass — Parsing & Formatting</h2>
  ${botPass.formatIssues.length > 0 ? botPass.formatIssues.map(i => `<div class="issue">${i}</div>`).join('') : '<p>No format issues detected.</p>'}
  <br/>
  ${botPass.extractedFields.map(f => `<div class="field"><span>${f.label}</span><span class="${f.status}">${f.value}</span></div>`).join('')}

  <h2>Algorithm Ranking — Hard Requirements</h2>
  ${algorithm.hardRequirements.map(r => `<div class="field"><span>${r.skill}</span><span class="${r.status}">${r.status.toUpperCase()}${r.context ? ' — ' + r.context : ''}</span></div>`).join('')}

  <h2>Soft Skills</h2>
  ${algorithm.softSkills.map(s => `<div class="field"><span>${s.skill}</span><span class="${s.status}">${s.status.toUpperCase()}</span></div>`).join('')}

  <h2>Phantom Matches</h2>
  ${algorithm.phantomMatches.map(p => `<div class="issue"><strong>${p.keyword}:</strong> ${p.reason}</div>`).join('')}

  <h2>Keyword Analysis</h2>
  ${keywordAnalysis.map(k => `<div class="keyword-row"><span class="${k.foundInCV ? 'found' : 'not-found'}">${k.foundInCV ? '✓' : '✗'}</span><strong>${k.keyword}</strong><span class="badge badge-${k.importance}">${k.importance}</span><span style="color:#666;font-size:11px">${k.context}</span></div>`).join('')}

  <h2>Recruiter Impression</h2>
  <p>${humanPass.overallImpression}</p>
  <h3 style="margin-top:12px;font-size:13px;">Strengths</h3>
  <ul>${humanPass.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
  <h3 style="margin-top:12px;font-size:13px;">Weaknesses</h3>
  <ul>${humanPass.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>

  <h2>Actionable Rewrites</h2>
  ${rewrites.map(r => `<div class="rewrite"><p><strong>${r.context}</strong></p><p class="before">Before: ${r.before}</p><p class="after">After: ${r.after}</p></div>`).join('')}
</body>
</html>`;

  // Open in new window for print/save as PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
};
