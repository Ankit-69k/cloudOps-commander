import Fastify from 'fastify';

import { registerRoutes } from '../routes';

const app = Fastify({
  logger: true,
});

// Root route
app.get('/', async () => {
  return { message: 'hello world' };
});

async function setup() {
  // Register routes here
  await registerRoutes(app);
}

setup();

export default app;
