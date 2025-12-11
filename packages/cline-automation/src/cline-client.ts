import { execa } from 'execa';
import { logger } from '@cloudops-commander/logger';
import type { ClineTask, ClineResponse } from './types';

export class ClineClient {
  private cliPath: string;
  private defaultTimeout: number;

  constructor(cliPath: string = 'cline', defaultTimeout: number = 300000) {
    this.cliPath = cliPath;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Execute a Cline automation task
   * @param task - The task configuration
   * @returns Promise resolving to task execution result
   * @throws Never throws - errors are captured in ClineResponse.error
   *
   * @remarks
   * Requires Cline CLI to be available at cliPath with the interface:
   *   cline execute --prompt <prompt_string>
   *
   * The CLI is expected to output files in the format:
   *   // FILE: <path>
   *   <content>
   */
  async executeTask(task: ClineTask): Promise<ClineResponse> {
    const startTime = Date.now();

    logger.info({ taskId: task.id, type: task.type }, 'Executing Cline task');

    try {
      const prompt = this.buildPrompt(task);

      // Execute Cline CLI
      const result = await execa(this.cliPath, ['execute', '--prompt', prompt], {
        timeout: task.timeout || this.defaultTimeout,
        stdio: 'pipe',
      });

      const duration = Date.now() - startTime;

      logger.info({ taskId: task.id, duration, exitCode: result.exitCode }, 'Cline task completed');

      return {
        success: result.exitCode === 0,
        output: result.stdout,
        duration,
        artifacts: this.parseArtifacts(result.stdout),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error({ taskId: task.id, error: error.message, duration }, 'Cline task failed');

      return {
        success: false,
        output: error.stdout || '',
        error: error.message,
        duration,
      };
    }
  }

  // Execute multiple tasks in parallel
  async executeParallel(tasks: ClineTask[]): Promise<ClineResponse[]> {
    logger.info({ taskCount: tasks.length }, 'Executing parallel Cline tasks');

    const promises = tasks.map((task) => this.executeTask(task));
    return Promise.all(promises);
  }

  // Execute tasks sequentially
  async executeSequential(tasks: ClineTask[]): Promise<ClineResponse[]> {
    logger.info({ taskCount: tasks.length }, 'Executing sequential Cline tasks');

    const results: ClineResponse[] = [];

    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);

      // Stop on first failure if critical
      if (!result.success && task.priority === 'critical') {
        logger.error({ taskId: task.id }, 'Critical task failed, stopping execution');
        break;
      }
    }

    return results;
  }

  // Build prompt for Cline based on task type
  private buildPrompt(task: ClineTask): string {
    const basePrompt = `Task: ${task.description}\nType: ${task.type}\n`;

    if (task.context) {
      return `${basePrompt}\nContext: ${JSON.stringify(task.context, null, 2)}`;
    }

    return basePrompt;
  }

  // Parse artifacts from Cline output
  private parseArtifacts(output: string): ClineResponse['artifacts'] {
    // Look for file markers in output
    const filePattern = /\/\/ FILE: (.+?)\n([\s\S]*?)(?=\/\/ FILE:|$)/g;
    const files: Array<{ path: string; content: string; type: string }> = [];

    let match;
    while ((match = filePattern.exec(output)) !== null) {
      const [, path, content] = match;
      files.push({
        path: path.trim(),
        content: content.trim(),
        type: this.getFileType(path),
      });
    }

    return files.length > 0 ? { files } : undefined;
  }

  // Determine file type from path
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

  // Validate Cline CLI is available
  async validateCli(): Promise<boolean> {
    try {
      await execa(this.cliPath, ['--version'], { timeout: 5000 });
      return true;
    } catch (error) {
      logger.error('Cline CLI not found or not executable');
      return false;
    }
  }
}
