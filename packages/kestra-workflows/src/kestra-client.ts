import axios, { AxiosInstance } from 'axios';
import { logger } from '@cloudops-commander/logger';
import YAML from 'yaml';
import type { WorkflowExecution, WorkflowDefinition } from './types';

export class KestraClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: `${this.baseUrl}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create or update a workflow
   */
  async createWorkflow(workflow: WorkflowDefinition): Promise<void> {
    logger.info({ namespace: workflow.namespace, flowId: workflow.id }, 'Creating Kestra workflow');

    const yamlContent = YAML.stringify(this.toKestraFormat(workflow));

    try {
      await this.client.put(`/flows/${workflow.namespace}/${workflow.id}`, yamlContent, {
        headers: {
          'Content-Type': 'application/x-yaml',
        },
      });

      logger.info({ flowId: workflow.id }, 'Workflow created successfully');
    } catch (error: any) {
      logger.error({ error: error.message, flowId: workflow.id }, 'Failed to create workflow');
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    namespace: string,
    flowId: string,
    inputs?: Record<string, any>
  ): Promise<WorkflowExecution> {
    logger.info({ namespace, flowId, inputs }, 'Executing workflow');

    try {
      const response = await this.client.post(`/executions/${namespace}/${flowId}`, {
        inputs,
      });

      logger.info({ executionId: response.data.id }, 'Workflow execution started');
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message, namespace, flowId }, 'Failed to execute workflow');
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    try {
      const response = await this.client.get(`/executions/${executionId}`);
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message, executionId }, 'Failed to get execution');
      throw error;
    }
  }

  /**
   * Wait for execution to complete
   */
  async waitForExecution(
    executionId: string,
    timeout: number = 300000
  ): Promise<WorkflowExecution> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const execution = await this.getExecution(executionId);

      if (['SUCCESS', 'FAILED', 'CANCELLED'].includes(execution.state)) {
        return execution;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Execution timeout');
  }

  /**
   * List all executions
   */
  async listExecutions(namespace?: string, flowId?: string): Promise<WorkflowExecution[]> {
    try {
      let url = '/executions';
      const params: any = {};

      if (namespace) params.namespace = namespace;
      if (flowId) params.flowId = flowId;

      const response = await this.client.get(url, { params });
      return response.data.results || [];
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list executions');
      throw error;
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    logger.info({ executionId }, 'Cancelling execution');

    try {
      await this.client.delete(`/executions/${executionId}`);
      logger.info({ executionId }, 'Execution cancelled');
    } catch (error: any) {
      logger.error({ error: error.message, executionId }, 'Failed to cancel execution');
      throw error;
    }
  }

  /**
   * Get workflow definition
   */
  async getWorkflow(namespace: string, flowId: string): Promise<WorkflowDefinition> {
    try {
      const response = await this.client.get(`/flows/${namespace}/${flowId}`);
      return this.fromKestraFormat(response.data);
    } catch (error: any) {
      logger.error({ error: error.message, namespace, flowId }, 'Failed to get workflow');
      throw error;
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(namespace: string, flowId: string): Promise<void> {
    logger.info({ namespace, flowId }, 'Deleting workflow');

    try {
      await this.client.delete(`/flows/${namespace}/${flowId}`);
      logger.info({ flowId }, 'Workflow deleted');
    } catch (error: any) {
      logger.error({ error: error.message, namespace, flowId }, 'Failed to delete workflow');
      throw error;
    }
  }

  /**
   * Convert workflow to Kestra format
   */
  private toKestraFormat(workflow: WorkflowDefinition): any {
    return {
      id: workflow.id,
      namespace: workflow.namespace,
      description: workflow.description,
      inputs: workflow.inputs,
      tasks: workflow.tasks,
      triggers: workflow.triggers,
    };
  }

  /**
   * Convert from Kestra format
   */
  private fromKestraFormat(data: any): WorkflowDefinition {
    return {
      id: data.id,
      namespace: data.namespace,
      description: data.description,
      inputs: data.inputs,
      tasks: data.tasks || [],
      triggers: data.triggers,
    };
  }
}
