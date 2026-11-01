import type { ReviewResult } from '../ai/ai.types.js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface PullRequestInfo {
  number: number;
  title: string;
  url: string;
  owner: string;
  repo: string;
}

export class ReportService {
  static generateMarkdown(
    pr: PullRequestInfo,
    review: ReviewResult
  ): string {

    const findings = review.findings;

    const severityOrder = [
      'critical',
      'high',
      'medium',
      'low'
    ];

    const sections = severityOrder.map(severity => {
      const items = findings.filter(
        finding => finding.severity === severity
      );

      if (items.length === 0) return '';

      return `
## ${severity.toUpperCase()} (${items.length})

${items.map(finding => `
### ${finding.file}:${finding.line}

- **Category:** ${finding.category}
- **Confidence:** ${finding.confidence}%
- **Validation:** ${finding.validation_status ?? 'unverified'}

**Issue:** ${finding.description}

**Suggested fix:** ${finding.suggestion}

**Evidence:**
\`\`\`
${finding.evidence}
\`\`\`

`).join('\n')}
`;
    }).join('\n');

    return `# PR Guardian — Code Review Report

## Pull Request

- **Repository:** ${pr.owner}/${pr.repo}
- **PR:** #${pr.number}
- **Title:** ${pr.title}
- **URL:** ${pr.url}

## Overall Assessment

- **Risk Level:** ${review.overall_risk.toUpperCase()}
- **Total Findings:** ${findings.length}

${review.summary}

${sections}

---

*Generated automatically by PR Guardian.*
`;
  }

  static async saveMarkdown(
  pr: PullRequestInfo,
  report: string
): Promise<string> {

  const reportsDir = path.resolve(process.cwd(), 'reports');

  await mkdir(reportsDir, { recursive: true });

  const filename = `${pr.owner}-${pr.repo}-PR-${pr.number}.md`;

  const filePath = path.join(reportsDir, filename);

  await writeFile(filePath, report, 'utf-8');

  return filePath;
}
}
export default ReportService;
