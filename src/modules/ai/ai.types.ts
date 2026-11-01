
export interface ReviewInput {
  title: string;
  description: string | null;
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch: string | null;
  }>;
}

export interface ReviewFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'bug' | 'security' | 'performance' | 'quality' | 'testing';
  file: string;
  line: number;
  confidence: number;
  description: string;
  suggestion: string;
  evidence: string;

  validation_status?: 'verified' | 'unverified' | 'rejected';
  validation_reason?: string;
}

export interface ReviewResult {
  summary: string;
  overall_risk: 'low' | 'medium' | 'high' | 'critical';
  findings: ReviewFinding[];
}

export interface AIProvider {
  reviewPullRequest(input: ReviewInput): Promise<ReviewResult>;
}
