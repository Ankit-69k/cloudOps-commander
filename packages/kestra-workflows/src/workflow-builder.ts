import { logger } from '@cloudops-commander/logger';
import type { WorkflowDefinition, WorkflowTask, WorkflowTrigger } from './types';

export class WorkflowBuilder {
  private workflow: Partial<WorkflowDefinition>;
  private tasks: WorkflowTask[] = [];
  private triggers: WorkflowTrigger[] = [];

  constructor(namespace: string, id: string) {
    this.workflow = {
      namespace,
      id,
      tasks: [],
      triggers: [],
    };
  }

  /**
   * Set workflow description
   */
  description(desc: string): this {
    this.workflow.description = desc;
    return this;
  }

  /**
   * Add input parameter
   */
  addInput(name: string, type: string, required: boolean = false, defaults?: any): this {
    if (!this.workflow.inputs) {
      this.workflow.inputs = [];
    }

    this.workflow.inputs.push({ name, type, required, defaults });
    return this;
  }

  /**
   * Add a task
   */
  addTask(task: WorkflowTask): this {
    this.tasks.push(task);
    return this;
  }

  /**
   * Add a log aggregation task
   */
  addLogAggregation(id: string, sources: string[]): this {
    this.tasks.push({
      id,
      type: 'io.kestra.core.tasks.log.Fetch',
      description: 'Aggregate logs from multiple sources',
      inputs: {
        sources,
      },
    });
    return this;
  }

  /**
   * Add AI agent task for data summarization
   */
  addAIAgentSummary(id: string, dataSource: string, prompt: string): this {
    this.tasks.push({
      id,
      type: 'io.kestra.plugin.openai.ChatCompletion',
      description: 'AI Agent summarizes data and makes decisions',
      inputs: {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI agent that analyzes infrastructure data and provides actionable insights.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nData: {{ outputs.${dataSource}.data }}`,
          },
        ],
        temperature: 0.7,
        maxTokens: 1000,
      },
    });
    return this;
  }

  /**
   * Add decision task based on AI agent output
   */
  addDecisionTask(
    id: string,
    condition: string,
    trueBranch: string[],
    falseBranch: string[]
  ): this {
    this.tasks.push({
      id,
      type: 'io.kestra.core.tasks.flows.If',
      description: 'Make decision based on AI agent analysis',
      inputs: {
        condition,
        then: trueBranch.map((taskId) => ({ id: taskId })),
        else: falseBranch.map((taskId) => ({ id: taskId })),
      },
    });
    return this;
  }

  /**
   * Add webhook notification task
   */
  addWebhookNotification(id: string, url: string, message: string): this {
    this.tasks.push({
      id,
      type: 'io.kestra.plugin.notifications.webhook.WebhookExecution',
      description: 'Send webhook notification',
      inputs: {
        url,
        payload: {
          message,
          timestamp: '{{ execution.startDate }}',
          executionId: '{{ execution.id }}',
        },
      },
    });
    return this;
  }

  /**
   * Add schedule trigger
   */
  addScheduleTrigger(cron: string): this {
    this.triggers.push({
      type: 'schedule',
      config: {
        cron,
      },
    });
    return this;
  }

  /**
   * Add webhook trigger
   */
  addWebhookTrigger(path: string): this {
    this.triggers.push({
      type: 'webhook',
      config: {
        path,
      },
    });
    return this;
  }

  /**
   * Build the workflow definition
   */
  build(): WorkflowDefinition {
    this.workflow.tasks = this.tasks;
    this.workflow.triggers = this.triggers;

    logger.info({ workflowId: this.workflow.id }, 'Workflow built');

    return this.workflow as WorkflowDefinition;
  }

  /**
   * Create infrastructure monitoring workflow
   */
  static createMonitoringWorkflow(namespace: string, resourceId: string): WorkflowDefinition {
    return new WorkflowBuilder(namespace, `monitoring-${resourceId}`)
      .description(`Monitor infrastructure resource ${resourceId}`)
      .addInput('resourceId', 'STRING', true, resourceId)
      .addInput('interval', 'STRING', false, '5m')
      .addLogAggregation('fetchLogs', ['cloudwatch', 'kubernetes', 'application'])
      .addAIAgentSummary(
        'analyzeData',
        'fetchLogs',
        'Analyze the following infrastructure logs and metrics. Identify any anomalies, potential issues, or optimization opportunities.'
      )
      .addDecisionTask(
        'checkSeverity',
        "{{ outputs.analyzeData.severity == 'high' || outputs.analyzeData.severity == 'critical' }}",
        ['createIncident', 'sendAlert'],
        ['logNormal']
      )
      .addScheduleTrigger('*/5 * * * *') // Every 5 minutes
      .build();
  }

  /**
   * Create incident response workflow
   */
  static createIncidentResponseWorkflow(namespace: string, incidentId: string): WorkflowDefinition {
    return new WorkflowBuilder(namespace, `incident-response-${incidentId}`)
      .description(`Automated incident response for ${incidentId}`)
      .addInput('incidentId', 'STRING', true, incidentId)
      .addInput('severity', 'STRING', true)
      .addLogAggregation('gatherContext', ['incident-logs', 'system-metrics', 'recent-changes'])
      .addAIAgentSummary(
        'diagnose',
        'gatherContext',
        'Diagnose the root cause of this incident based on the gathered data. Suggest remediation steps.'
      )
      .addDecisionTask(
        'autoRemediate',
        '{{ outputs.diagnose.confidence > 0.8 }}',
        ['executeRemediation', 'notifySuccess'],
        ['escalateToHuman']
      )
      .addWebhookNotification(
        'notifyTeam',
        'https://api.slack.com/webhooks/...',
        'Incident response executed'
      )
      .build();
  }

  /**
   * Create scaling workflow
   */
  static createScalingWorkflow(namespace: string, resourceId: string): WorkflowDefinition {
    return new WorkflowBuilder(namespace, `auto-scaling-${resourceId}`)
      .description(`Auto-scaling workflow for ${resourceId}`)
      .addInput('resourceId', 'STRING', true, resourceId)
      .addInput('minInstances', 'NUMBER', true, 2)
      .addInput('maxInstances', 'NUMBER', true, 10)
      .addLogAggregation('fetchMetrics', ['cpu', 'memory', 'requests'])
      .addAIAgentSummary(
        'analyzeLoad',
        'fetchMetrics',
        'Analyze current resource utilization and predict if scaling is needed. Consider historical patterns and current load.'
      )
      .addDecisionTask(
        'shouldScale',
        "{{ outputs.analyzeLoad.recommendations contains 'scale' }}",
        ['scaleResources', 'notifyScaling'],
        ['logNoAction']
      )
      .addScheduleTrigger('*/10 * * * *') // Every 10 minutes
      .build();
  }
}
