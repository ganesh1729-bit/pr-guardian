
import { Module } from '@nitrostack/core';
import { GitHubTools } from './github.tools.js';


@Module({
  name: 'github',
  description: 'GitHub repository and pull request tools',
  controllers: [GitHubTools]
})
export class GitHubModule {}
