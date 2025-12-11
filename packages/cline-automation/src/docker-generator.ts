import { logger } from '@cloudops-commander/logger';
import { ClineClient } from './cline-client';
import type { DockerConfig, ClineTask } from './types';

export class DockerGenerator {
  private client: ClineClient;

  constructor(client?: ClineClient) {
    this.client = client || new ClineClient();
  }

  // Generate Dockerfile using Cline
  async generate(config: DockerConfig): Promise<string> {
    logger.info({ baseImage: config.baseImage }, 'Generating Dockerfile');

    const task: ClineTask = {
      id: `docker-${Date.now()}`,
      type: 'docker',
      description: `Generate a Dockerfile based on ${config.baseImage}`,
      context: config,
      priority: 'high',
    };

    const response = await this.client.executeTask(task);

    if (!response.success) {
      throw new Error(`Dockerfile generation failed: ${response.error}`);
    }

    const dockerfile = response.artifacts?.files.find((f) =>
      f.path.toLowerCase().includes('dockerfile')
    );

    if (dockerfile) {
      return dockerfile.content;
    }

    // Fallback to manual generation
    return this.generateManually(config);
  }

  // Generate Node.js Dockerfile
  async generateNodejs(config: {
    nodeVersion?: string;
    workdir?: string;
    port?: number;
  }): Promise<string> {
    const dockerConfig: DockerConfig = {
      baseImage: `node:${config.nodeVersion || '20'}-alpine`,
      workdir: config.workdir || '/app',
      commands: [
        { type: 'COPY', value: 'package*.json ./' },
        { type: 'RUN', value: 'npm ci --only=production' },
        { type: 'COPY', value: '. .' },
        { type: 'EXPOSE', value: String(config.port || 3000) },
        { type: 'CMD', value: '["node", "index.js"]' },
      ],
      ports: [config.port || 3000],
    };

    return this.generate(dockerConfig);
  }

  // Generate Python Dockerfile
  async generatePython(config: {
    pythonVersion?: string;
    requirements?: boolean;
    port?: number;
  }): Promise<string> {
    const commands: DockerConfig['commands'] = [
      { type: 'COPY', value: 'requirements.txt ./' },
      { type: 'RUN', value: 'pip install --no-cache-dir -r requirements.txt' },
      { type: 'COPY', value: '. .' },
    ];

    if (config.port) {
      commands.push({ type: 'EXPOSE', value: String(config.port) });
    }

    commands.push({ type: 'CMD', value: '["python", "app.py"]' });

    const dockerConfig: DockerConfig = {
      baseImage: `python:${config.pythonVersion || '3.11'}-slim`,
      workdir: '/app',
      commands,
      ports: config.port ? [config.port] : undefined,
    };

    return this.generate(dockerConfig);
  }

  // Generate multi-stage Dockerfile
  async generateMultiStage(config: {
    buildImage: string;
    runtimeImage: string;
    buildCommands: string[];
    runtimeCommands: string[];
    port?: number;
  }): Promise<string> {
    let dockerfile = `# Build stage
FROM ${config.buildImage} AS builder
WORKDIR /build

`;

    config.buildCommands.forEach((cmd) => {
      dockerfile += `${cmd}\n`;
    });

    dockerfile += `
# Runtime stage
FROM ${config.runtimeImage}
WORKDIR /app

COPY --from=builder /build/dist ./dist

`;

    config.runtimeCommands.forEach((cmd) => {
      dockerfile += `${cmd}\n`;
    });

    if (config.port) {
      dockerfile += `\nEXPOSE ${config.port}\n`;
    }

    return dockerfile;
  }

  // Manual Dockerfile generation
  private generateManually(config: DockerConfig): string {
    let dockerfile = `FROM ${config.baseImage}\n\n`;

    if (config.workdir) {
      dockerfile += `WORKDIR ${config.workdir}\n\n`;
    }

    config.commands.forEach((cmd) => {
      dockerfile += `${cmd.type} ${cmd.value}\n`;
    });

    if (config.env) {
      dockerfile += '\n';
      Object.entries(config.env).forEach(([key, value]) => {
        dockerfile += `ENV ${key}=${value}\n`;
      });
    }

    return dockerfile;
  }
}
