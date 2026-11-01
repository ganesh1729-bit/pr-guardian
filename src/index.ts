
import 'dotenv/config';
import { McpApplicationFactory } from '@nitrostack/core';
import { AppModule } from './app.module.js';
import './api/server.js';

async function bootstrap() {
  const server = await McpApplicationFactory.create(AppModule);

  await server.start({
    transport: 'dual',
    port: 3002,
    host: '0.0.0.0',
    endpoint: '/mcp',
    enableCors: true,
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
