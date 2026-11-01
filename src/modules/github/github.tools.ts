
import { ToolDecorator as Tool, ExecutionContext, z } from '@nitrostack/core';
import { AIProviderFactory } from '../ai/ai.factory.js';
import { ReviewValidator } from '../ai/review-validator.js';
import ReportService from '../report/report.service.js';

export class GitHubTools {
  @Tool({
    name: 'get_pull_request',
    description: 'Fetch details of a GitHub pull request using its repository owner, name and PR number.',
    inputSchema: z.object({
      owner: z.string().describe('GitHub repository owner'),
      repo: z.string().describe('GitHub repository name'),
      pull_number: z.number().int().positive().describe('Pull request number')
    })
  })
  async getPullRequest(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Fetching GitHub pull request', {
      owner: input.owner,
      repo: input.repo,
      pull_number: input.pull_number
    });


    const url = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/pulls/${input.pull_number}`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
    }

    const pr: any = await response.json();

    return {
      number: pr.number,
      title: pr.title,
      description: pr.body,
      state: pr.state,
      author: pr.user?.login,
      url: pr.html_url,
      base_branch: pr.base?.ref,
      head_branch: pr.head?.ref,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged: pr.merged
    };
  }

  
  @Tool({
    name: 'get_pull_request_files',
    description: 'Fetch all files changed in a GitHub pull request, including their diffs.',
    inputSchema: z.object({
      owner: z.string().describe('GitHub repository owner'),
      repo: z.string().describe('GitHub repository name'),
      pull_number: z.number().int().positive().describe('Pull request number')
    })
  })
  async getPullRequestFiles(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Fetching pull request files', {
      owner: input.owner,
      repo: input.repo,
      pull_number: input.pull_number
    });

    const url = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/pulls/${input.pull_number}/files`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const files: any[] = [];
    let page = 1;

    while (true) {
      const response = await fetch(`${url}?per_page=100&page=${page}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
      }

      const batch = await response.json() as any[];

      files.push(...batch);

      if (batch.length < 100) break;

      page++;
    }

    return {
      total_files: files.length,
      files: files.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch ?? null
      }))
    };
  }

  
  @Tool({
    name: 'review_pull_request',
    description: 'Perform an AI-powered code review of a GitHub pull request using Gemini.',
    inputSchema: z.object({
      owner: z.string().describe('GitHub repository owner'),
      repo: z.string().describe('GitHub repository name'),
      pull_number: z.number().int().positive().describe('Pull request number')
    })
  })
  async reviewPullRequest(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Starting AI pull request review', input);

    const github = this;

    const pr = await github.getPullRequest(input, ctx);
    const result = await github.getPullRequestFiles(input, ctx);

    const ai = AIProviderFactory.create();

    const review = await ai.reviewPullRequest({
      title: pr.title,
      description: pr.description,
      files: result.files
    });

    review.findings = ReviewValidator.validate(
  review.findings,
  {
    title: pr.title,
    description: pr.description,
    files: result.files
  }
);

   const report = ReportService.generateMarkdown(
  {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    owner: input.owner,
    repo: input.repo
  },
  review
);
const reportPath = await ReportService.saveMarkdown(
  {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    owner: input.owner,
    repo: input.repo
  },
  report
);

return {
  pull_request: {
    number: pr.number,
    title: pr.title,
    url: pr.url
  },
  total_files_reviewed: result.total_files,
  review,
  report,
  report_path: reportPath
};
  }


}
