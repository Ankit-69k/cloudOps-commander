import Fastify from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

import { registerRoutes } from '../routes';

const app = Fastify({
  logger: true,
});

// Root route
app.get('/', async () => {
  return { message: 'hello world' };
});

export async function initializeApp() {
  await registerRoutes(app);
  return app;
}
