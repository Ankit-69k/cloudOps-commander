import { FastifyInstance } from 'fastify';
import AutomationRoutes from './cline-automation.route';

export async function registerRoutes(server: FastifyInstance) {
  await server.register(
    async (api) => {
      await api.register(AutomationRoutes.register.bind(AutomationRoutes), {
        prefix: '/automation',
      });
    },
    { prefix: '/api/v1' }
  );
}
