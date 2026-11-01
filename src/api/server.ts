
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GitHubTools } from '../modules/github/github.tools.js';
import type { ExecutionContext } from '@nitrostack/core';

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL || 'http://localhost:5175'
).split(',');

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

const githubTools = new GitHubTools();

const context = {
  logger: {
    info: (...args: unknown[]) => console.log(...args)
  }
} as unknown as ExecutionContext;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'PR Guardian API is running' });
});

app.post('/api/review', async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.body;

    if (
      typeof owner !== 'string' || !owner.trim() ||
      typeof repo !== 'string' || !repo.trim() ||
      !Number.isInteger(pull_number) || pull_number < 1
    ) {
      return res.status(400).json({
        error: 'Invalid repository or pull request details'
      });
    }

    const result = await githubTools.reviewPullRequest(
      { owner, repo, pull_number },
      context
    );

    return res.json(result);
  } catch (error) {
    console.error('Review failed:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Review failed'
    });
  }
});

const PORT = Number(process.env.API_PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PR Guardian REST API running on port ${PORT}`);
});
