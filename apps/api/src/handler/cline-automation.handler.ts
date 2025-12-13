import { FastifyReply, FastifyRequest } from 'fastify';
import { ClineAutomationService } from '../services/cline-automation.service';

import {
  TerraformJobSchema,
  KubernetesJobSchema,
  DockerJobSchema,
} from '../validators/cline-automation.validators';

export class AutomationHandler {
  private automationService: ClineAutomationService;

  constructor() {
    this.automationService = new ClineAutomationService();
  }

  async createTerraform(
    request: FastifyRequest<{ Params: { resourceId: string } }>,
    reply: FastifyReply
  ) {
    const { resourceId } = request.params;
    const body = TerraformJobSchema.parse(request.body);

    const job = await this.automationService.createTerraformJob(resourceId, body);

    return reply.send({
      jobId: job.id,
      status: 'queued',
      message: 'Terraform generation job created',
    });
  }

  async createKubernetes(
    request: FastifyRequest<{ Params: { resourceId: string } }>,
    reply: FastifyReply
  ) {
    const { resourceId } = request.params;
    const body = KubernetesJobSchema.parse(request.body);

    const job = await this.automationService.createKubernetesJob(resourceId, body);

    return reply.send({
      jobId: job.id,
      status: 'queued',
      message: 'Kubernetes generation job created',
    });
  }

  async createDocker(
    request: FastifyRequest<{ Params: { resourceId: string } }>,
    reply: FastifyReply
  ) {
    const { resourceId } = request.params;
    const body = DockerJobSchema.parse(request.body);

    const job = await this.automationService.createDockerJob(resourceId, body);

    return reply.send({
      jobId: job.id,
      status: 'queued',
      message: 'Dockerfile generation job created',
    });
  }

  async getJobStatus(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    const { jobId } = request.params;

    const status = await this.automationService.getJobStatus(jobId);
    if (!status) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    return reply.send({ data: status });
  }

  async cancelJob(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    const { jobId } = request.params;

    await this.automationService.cancelJob(jobId);

    return reply.send({ message: 'Job cancelled successfully' });
  }
}
