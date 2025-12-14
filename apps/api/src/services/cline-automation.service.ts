// import { // logger } from '@cloudops-commander/// logger';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  ClineClient,
  TerraformGenerator,
  KubernetesGenerator,
  DockerGenerator,
} from '@cloudops-commander/cline-automation';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@cloudops-commander/database';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export class ClineAutomationService {
  private queue: Queue;
  private worker!: Worker;
  private client: ClineClient;
  private tfGenerator: TerraformGenerator;
  private k8sGenerator: KubernetesGenerator;
  private dockerGenerator: DockerGenerator;
  private artifactsDir: string;

  constructor() {
    this.client = new ClineClient();

    this.tfGenerator = new TerraformGenerator(this.client);
    this.k8sGenerator = new KubernetesGenerator(this.client);
    this.dockerGenerator = new DockerGenerator(this.client);

    // Set up artifacts directory
    this.artifactsDir = path.join(process.cwd(), 'artifacts');
    fs.mkdir(this.artifactsDir, { recursive: true }).catch(() => {});

    this.queue = new Queue('cline-automation', { connection });

    this.initWorker();

    // logger.info('Cline Automation Service initialized');
  }

  private initWorker() {
    this.worker = new Worker(
      'cline-automation',
      async (job: Job) => {
        // logger.info({ jobId: job.id, data: job.data }, 'Processing Cline automation job');

        try {
          const result = await this.processJob(job);

          // Update infrastructure status
          if (job.data.resourceId) {
            await prisma.infrastructure.update({
              where: { id: job.data.resourceId },
              data: {
                status: result.success ? 'running' : 'failed',
                config: {
                  ...(typeof job.data.config === 'object' ? job.data.config : {}),
                  lastAutomation: {
                    jobId: job.id,
                    timestamp: new Date().toISOString(),
                    success: result.success,
                  },
                },
              },
            });
          }

          return result;
        } catch (error: any) {
          // logger.error({ error: error.message, jobId: job.id }, 'Cline automation failed');
          throw error;
        }
      },
      { connection }
    );

    this.worker.on('completed', (job) => {
      // logger.info({ jobId: job.id }, 'Cline automation completed');
      console.log(job);
    });

    this.worker.on('failed', (job, err) => {
      // logger.error({ jobId: job?.id, error: err.message }, 'Cline automation failed');
      console.log({ jobId: job?.id, error: err.message });
    });
  }

  private async processJob(job: Job) {
    const { action, resourceId, config } = job.data;

    switch (action) {
      case 'provision-terraform':
        return this.provisionTerraform(resourceId, config);
      case 'provision-kubernetes':
        return this.provisionKubernetes(resourceId, config);
      case 'generate-docker':
        return this.generateDocker(resourceId, config);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async provisionTerraform(resourceId: string, config: any) {
    // logger.info({ resourceId }, 'Provisioning infrastructure with Terraform');

    const terraform = await this.tfGenerator.generate({
      provider: config.provider || 'aws',
      region: config.region || 'us-east-1',
      resources: config.resources || [],
    });

    // Save generated Terraform to database or file system
    await this.saveArtifact(resourceId, 'main.tf', terraform);

    return {
      success: true,
      output: terraform,
      artifactPath: `artifacts/${resourceId}/main.tf`,
    };
  }

  async provisionKubernetes(resourceId: string, config: any) {
    // logger.info({ resourceId }, 'Generating Kubernetes manifests');

    const { deployment, service, ingress } = await this.k8sGenerator.generateFullStack({
      name: config.name || 'app',
      namespace: config.namespace || 'default',
      replicas: config.replicas || 3,
      image: config.image || 'nginx:latest',
      port: config.port || 80,
      host: config.host || 'app.example.com',
    });

    // Save generated manifests
    await this.saveArtifact(resourceId, 'deployment.yaml', deployment);
    await this.saveArtifact(resourceId, 'service.yaml', service);
    await this.saveArtifact(resourceId, 'ingress.yaml', ingress);

    return {
      success: true,
      output: { deployment, service, ingress },
      artifactPath: `artifacts/${resourceId}/`,
    };
  }

  async generateDocker(resourceId: string, config: any) {
    // logger.info({ resourceId }, 'Generating Dockerfile');

    const dockerfile = await this.dockerGenerator.generateNodejs({
      nodeVersion: config.nodeVersion || '20',
      workdir: config.workdir || '/app',
      port: config.port || 3000,
    });

    await this.saveArtifact(resourceId, 'Dockerfile', dockerfile);

    return {
      success: true,
      output: dockerfile,
      artifactPath: `artifacts/${resourceId}/Dockerfile`,
    };
  }

  private async saveArtifact(resourceId: string, filename: string, content: string) {
    // In production, save to S3, GCS, or local file system
    // For now, we'll just log it
    // logger.info({ resourceId, filename, content }, 'Artifact generated');
    // You can implement actual file saving here:
    // import fs from 'fs/promises';
    // const path = `./artifacts/${resourceId}/${filename}`;
    // await fs.mkdir(`./artifacts/${resourceId}`, { recursive: true });
    // await fs.writeFile(path, content);
    console.log({ resourceId, filename, content });
  }

  // Public API methods

  async createTerraformJob(resourceId: string, config: any) {
    return this.queue.add('provision-terraform', {
      action: 'provision-terraform',
      resourceId,
      config,
    });
  }

  async createKubernetesJob(resourceId: string, config: any) {
    return this.queue.add('provision-kubernetes', {
      action: 'provision-kubernetes',
      resourceId,
      config,
    });
  }

  async createDockerJob(resourceId: string, config: any) {
    return this.queue.add('generate-docker', {
      action: 'generate-docker',
      resourceId,
      config,
    });
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      id: job.id,
      state,
      progress: job.progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  async cancelJob(jobId: string) {
    const job = await this.queue.getJob(jobId);

    if (job) {
      await job.remove();
      // logger.info({ jobId }, 'Job cancelled');
      return true;
    }
    return false;
  }
}
