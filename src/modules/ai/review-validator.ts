
import {
  ReviewFinding,
  ReviewInput
} from './ai.types.js';

export class ReviewValidator {
  static validate(
    findings: ReviewFinding[],
    input: ReviewInput
  ): ReviewFinding[] {

    return findings.map(finding => {
      const file = input.files.find(
        item => item.filename === finding.file
      );

      if (!file) {
        return {
          ...finding,
          validation_status: 'rejected',
          validation_reason: 'File does not exist in this pull request.'
        };
      }

      if (!file.patch) {
        return {
          ...finding,
          validation_status: 'unverified',
          validation_reason: 'GitHub did not provide a diff for this file.'
        };
      }

      // Extract added lines and their actual new-file line numbers.
      const addedLines: { line: number; content: string }[] = [];
      const diffLines = file.patch.split('\n');

      let newLineNumber = 0;

      for (const diffLine of diffLines) {
        if (diffLine.startsWith('+++')) continue;

        const hunk = diffLine.match(
          /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/
        );

        if (hunk) {
          newLineNumber = Number(hunk[1]);
          continue;
        }

        if (diffLine.startsWith('+')) {
          addedLines.push({
            line: newLineNumber,
            content: diffLine.substring(1)
          });
          newLineNumber++;
        } else if (diffLine.startsWith('-')) {
          // Removed lines do not increment the new-file line number.
          continue;
        } else if (diffLine.startsWith(' ')) {
          newLineNumber++;
        }
      }

      // Extract useful code lines from the AI's evidence.
      const evidenceLines = finding.evidence
        .replace(/```[\w]*\n?/g, '')
        .replace(/```/g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const matchedLines = evidenceLines.filter(evidenceLine =>
        addedLines.some(added =>
          added.content.trim().includes(evidenceLine) ||
          evidenceLine.includes(added.content.trim())
        )
      );

      const evidenceMatches =
        evidenceLines.length > 0 &&
        matchedLines.length > 0;

      const lineMatches = addedLines.some(
        added => added.line === finding.line
      );

      if (!evidenceMatches || !lineMatches) {
        return {
          ...finding,
          validation_status: 'unverified',
          validation_reason: !evidenceMatches
            ? 'Evidence could not be matched against added lines.'
            : 'Reported line number is not an added line in the diff.'
        };
      }

      return {
        ...finding,
        validation_status: 'verified',
        validation_reason: 'Evidence and line number match the GitHub diff.'
      };
    });
  }
}
