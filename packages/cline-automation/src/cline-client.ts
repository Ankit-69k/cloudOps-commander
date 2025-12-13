import { execa } from 'execa';
import { logger } from '@cloudops-commander/logger';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { ClineTask, ClineResponse } from './types';

export class ClineClient {
  private cliPath: string;
  private defaultTimeout: number;
  private workDir: string;

  constructor(cliPath: string = 'cline', defaultTimeout: number = 300000) {
    this.cliPath = cliPath;
    this.defaultTimeout = defaultTimeout;
    this.workDir = path.join(os.tmpdir(), 'cline-tasks');
  }

  /**
   * Execute a Cline automation task using the task API with auto-approval
   */
  async executeTask(task: ClineTask): Promise<ClineResponse> {
    const startTime = Date.now();

    logger.info({ taskId: task.id, type: task.type }, 'Executing Cline task');

    try {
      // Create working directory for this task
      const sanitizedId = task.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const taskDir = path.join(this.workDir, sanitizedId);
      await fs.mkdir(taskDir, { recursive: true });

      // Build the prompt/message for Cline
      const message = this.buildPrompt(task);

      // Create a task file for non-interactive execution
      const taskFile = path.join(taskDir, 'task.txt');
      await fs.writeFile(taskFile, message, 'utf-8');

      logger.info({ taskFile, taskDir }, 'Starting Cline task');

      const result = await execa(
        this.cliPath,
        [message, '--oneshot', '--mode', 'plan', '--output-format', 'plain'],
        {
          cwd: taskDir,
          timeout: task.timeout || this.defaultTimeout,
          env: {
            ...process.env,
            CI: 'true',
          },
          all: true,
        }
      );

      const duration = Date.now() - startTime;

      logger.info(
        {
          taskId: task.id,
          duration,
          exitCode: result.exitCode,
        },
        'Cline task completed'
      );

      // Read generated files from task directory
      const artifacts = await this.readGeneratedFiles(taskDir);

      return {
        success: result.exitCode === 0 && artifacts !== undefined,
        output: result.stdout || result.all || '',
        duration,
        artifacts,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Check if we got output despite the error (timeout)
      const taskDir = path.join(this.workDir, task.id);
      const artifacts = await this.readGeneratedFiles(taskDir).catch(() => undefined);

      // If we have artifacts, consider it a success even if timeout occurred
      if (artifacts && artifacts.files.length > 0) {
        logger.warn(
          {
            taskId: task.id,
            duration,
            message: 'Task timed out but generated files were found',
          },
          'Cline task partially completed'
        );

        return {
          success: true,
          output: error.stdout || error.all || 'Task completed with timeout',
          duration,
          artifacts,
        };
      }

      logger.error(
        {
          taskId: task.id,
          error: error.message,
          duration,
        },
        'Cline task failed'
      );

      return {
        success: false,
        output: error.stdout || error.all || '',
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Alternative: Execute directly without interactive mode
   * This bypasses the approval system entirely
   */
  async executeTaskDirect(task: ClineTask): Promise<ClineResponse> {
    const startTime = Date.now();

    logger.info({ taskId: task.id, type: task.type }, 'Executing Cline task (direct mode)');

    try {
      const taskDir = path.join(this.workDir, task.id);
      await fs.mkdir(taskDir, { recursive: true });

      const message = this.buildPrompt(task);

      logger.info({ message: message.substring(0, 200) + '...' }, 'Executing Cline');

      // Run Cline with a shorter timeout but check for files
      const clineProcess = execa(this.cliPath, [message], {
        cwd: taskDir,
        timeout: 30000, // 30 second timeout
        env: {
          ...process.env,
          CLINE_AUTO_APPROVE: 'true',
          CLINE_NON_INTERACTIVE: 'true',
          CI: 'true',
        },
        all: true,
        reject: false, // Don't reject on non-zero exit
      });

      // Wait for process
      const result = await clineProcess;

      // Give Cline a moment to write files
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const duration = Date.now() - startTime;

      // Check for generated files regardless of exit code
      const artifacts = await this.readGeneratedFiles(taskDir);

      const success = artifacts !== undefined && artifacts.files.length > 0;

      logger.info(
        {
          taskId: task.id,
          duration,
          filesGenerated: artifacts?.files.length || 0,
          success,
        },
        'Cline task completed (direct mode)'
      );

      return {
        success,
        output: result.stdout || result.all || '',
        duration,
        artifacts,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error(
        {
          taskId: task.id,
          error: error.message,
          duration,
        },
        'Cline task failed (direct mode)'
      );

      return {
        success: false,
        output: error.stdout || error.all || '',
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Read all files generated by Cline in the task directory
   */
  private async readGeneratedFiles(taskDir: string): Promise<ClineResponse['artifacts']> {
    try {
      const files: Array<{ path: string; content: string; type: string }> = [];

      // Check if directory exists
      try {
        await fs.access(taskDir);
      } catch {
        logger.warn({ taskDir }, 'Task directory does not exist');
        return undefined;
      }

      const entries = await fs.readdir(taskDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip task.txt and hidden files
        if (entry.name === 'task.txt' || entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isFile()) {
          const filePath = path.join(taskDir, entry.name);
          const content = await fs.readFile(filePath, 'utf-8');

          // Skip empty files
          if (content.trim().length === 0) {
            continue;
          }

          files.push({
            path: entry.name,
            content,
            type: this.getFileType(entry.name),
          });

          logger.info({ file: entry.name, size: content.length }, 'Found generated file');
        }
      }

      return files.length > 0 ? { files } : undefined;
    } catch (error: any) {
      logger.warn({ taskDir, error: error.message }, 'Failed to read generated files');
      return undefined;
    }
  }

  /**
   * Build proper prompt for Cline CLI
   */
  private buildPrompt(task: ClineTask): string {
    let prompt = '';

    switch (task.type) {
      case 'terraform':
        prompt = this.buildTerraformPrompt(task);
        break;
      case 'kubernetes':
        prompt = this.buildKubernetesPrompt(task);
        break;
      case 'docker':
        prompt = this.buildDockerPrompt(task);
        break;
      default:
        prompt = task.description;
    }

    return prompt;
  }

  private buildTerraformPrompt(task: ClineTask): string {
    const context = task.context as any;

    return `Create a file named main.tf with Terraform configuration.

Provider: ${context?.provider || 'aws'}
Region: ${context?.region || 'us-east-1'}

Create these resources:
${context?.resources?.map((r: any) => `- ${r.type} "${r.name}" with ${JSON.stringify(r.config)}`).join('\n') || ''}

Include:
- Provider block with region
- Resource blocks with proper tags (Name, ManagedBy)
- Output blocks for IDs and IPs
- Use Terraform 1.0+ syntax

Do not ask for approval - just create the file.`;
  }

  private buildKubernetesPrompt(task: ClineTask): string {
    const context = task.context as any;

    return `Create Kubernetes YAML manifests with these specifications:

Name: ${context?.name || 'app'}
Namespace: ${context?.namespace || 'default'}
Replicas: ${context?.replicas || 3}
Image: ${context?.image || 'nginx:latest'}
Port: ${context?.port || 80}

Create these files:
1. deployment.yaml - Deployment manifest
2. service.yaml - Service manifest (LoadBalancer)
3. ingress.yaml - Ingress manifest for ${context?.host || 'app.example.com'}

Include proper labels, selectors, and resource limits.
Do not ask for approval - just create the files.`;
  }

  private buildDockerPrompt(task: ClineTask): string {
    const context = task.context as any;

    return `Create a file named Dockerfile with these specifications:

Base: ${context?.baseImage || 'node:20-alpine'}
Workdir: ${context?.workdir || '/app'}
Port: ${context?.port || 3000}

Include:
- Multi-stage build if needed
- Proper COPY instructions
- EXPOSE port
- Non-root user
- Best practices

Do not ask for approval - just create the file.`;
  }

  private getFileType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, string> = {
      tf: 'terraform',
      yaml: 'kubernetes',
      yml: 'kubernetes',
      dockerfile: 'docker',
      ts: 'typescript',
      js: 'javascript',
      json: 'json',
    };

    return typeMap[ext || ''] || 'text';
  }

  async executeParallel(tasks: ClineTask[]): Promise<ClineResponse[]> {
    logger.info({ taskCount: tasks.length }, 'Executing parallel Cline tasks');
    const promises = tasks.map((task) => this.executeTaskDirect(task));
    return Promise.all(promises);
  }

  async executeSequential(tasks: ClineTask[]): Promise<ClineResponse[]> {
    logger.info({ taskCount: tasks.length }, 'Executing sequential Cline tasks');
    const results: ClineResponse[] = [];

    for (const task of tasks) {
      const result = await this.executeTaskDirect(task);
      results.push(result);

      if (!result.success && task.priority === 'critical') {
        logger.error({ taskId: task.id }, 'Critical task failed, stopping execution');
        break;
      }
    }

    return results;
  }

  async validateCli(): Promise<boolean> {
    try {
      const result = await execa(this.cliPath, ['version'], { timeout: 5000 });
      logger.info({ version: result.stdout }, 'Cline CLI validated');
      return true;
    } catch (error) {
      logger.error('Cline CLI not found or not executable');
      return false;
    }
  }

  async cleanup(maxAge: number = 3600000): Promise<void> {
    try {
      const entries = await fs.readdir(this.workDir, { withFileTypes: true });
      const now = Date.now();

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(this.workDir, entry.name);

          // Check for a marker file to get creation time
          const markerPath = path.join(dirPath, '.created');
          let createdTime;
          try {
            const markerStats = await fs.stat(markerPath);
            createdTime = markerStats.mtimeMs;
          } catch {
            // Fallback to directory stats if no marker
            const stats = await fs.stat(dirPath);
            createdTime = stats.mtimeMs;
          }

          if (now - createdTime > maxAge) {
            await fs.rm(dirPath, { recursive: true, force: true });
            logger.info({ dir: entry.name }, 'Cleaned up old task directory');
          }
        }
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to cleanup task directories');
    }
  }
}
