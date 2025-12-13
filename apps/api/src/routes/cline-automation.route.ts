import { FastifyInstance } from 'fastify';
import { AutomationHandler } from '../handler/cline-automation.handler';

export class AutomationRoutes {
  private handler: AutomationHandler;

  constructor() {
    this.handler = new AutomationHandler();
  }

  register(server: FastifyInstance) {
    server.post('/terraform/:resourceId', this.handler.createTerraform.bind(this.handler));
    server.post('/kubernetes/:resourceId', this.handler.createKubernetes.bind(this.handler));
    server.post('/docker/:resourceId', this.handler.createDocker.bind(this.handler));

    server.get('/jobs/:jobId', this.handler.getJobStatus.bind(this.handler));
    server.delete('/jobs/:jobId', this.handler.cancelJob.bind(this.handler));
  }
}

export default new AutomationRoutes();
