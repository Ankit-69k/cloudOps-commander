import { logger } from '@cloudops-commander/logger';
import { ClineClient } from './cline-client';
import type { TerraformConfig, ClineTask } from './types';

export class TerraformGenerator {
  private client: ClineClient;

  constructor(client?: ClineClient) {
    this.client = client || new ClineClient();
  }

  // Generate Terraform configuration using Cline
  async generate(config: TerraformConfig): Promise<string> {
    logger.info({ provider: config.provider }, 'Generating Terraform configuration');

    const task: ClineTask = {
      id: `terraform-${Date.now()}`,
      type: 'terraform',
      description: this.buildDescription(config),
      context: config,
      priority: 'high',
    };

    const response = await this.client.executeTask(task);

    if (!response.success) {
      throw new Error(`Terraform generation failed: ${response.error}`);
    }

    // Extract main.tf from artifacts
    const mainTf = response.artifacts?.files.find((f) => f.path.includes('main.tf'));

    if (!mainTf) {
      // Fallback to manual generation if Cline doesn't return artifacts
      return this.generateManually(config);
    }

    return mainTf.content;
  }

  // Generate multiple Terraform modules
  async generateModules(configs: TerraformConfig[]): Promise<Map<string, string>> {
    const tasks: ClineTask[] = configs.map((config, index) => ({
      id: `terraform-module-${index}-${Date.now()}`,
      type: 'terraform',
      description: this.buildDescription(config),
      context: config,
      priority: 'medium',
    }));

    const responses = await this.client.executeParallel(tasks);
    const modules = new Map<string, string>();

    responses.forEach((response, index) => {
      if (response.success && response.artifacts) {
        const content = response.artifacts.files.find((f) => f.path.includes('main.tf'));
        if (content) {
          modules.set(`module-${index}`, content.content);
        }
      }
    });

    return modules;
  }

  // Validate generated Terraform
  async validate(terraformCode: string): Promise<boolean> {
    const task: ClineTask = {
      id: `terraform-validate-${Date.now()}`,
      type: 'terraform',
      description: 'Validate the following Terraform configuration and check for errors',
      context: { code: terraformCode },
      priority: 'medium',
    };

    const response = await this.client.executeTask(task);
    return response.success;
  }

  // Build description for Cline
  private buildDescription(config: TerraformConfig): string {
    const resourceNames = config.resources.map((r) => `${r.type}.${r.name}`).join(', ');

    return `Generate Terraform configuration for ${config.provider} in ${config.region} region. 
            Resources: ${resourceNames}. 
            Include proper variables, outputs, and best practices for production use.`;
  }

  // Format HCL value
  private formatHclValue(value: unknown): string {
    if (typeof value === 'string') {
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      return `"${escaped}"`;
    }
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    return JSON.stringify(value);
  }

  // Manual Terraform generation as fallback
  private generateManually(config: TerraformConfig): string {
    const { provider, region, resources } = config;

    let tf = `# Generated Terraform Configuration
# Provider: ${provider}
# Region: ${region}

terraform {
required_version = ">= 1.0"
required_providers {
    ${provider} = {
    source  = "hashicorp/${provider}"
    version = "~> 5.0"
    }
}
}

provider "${provider}" {
region = "${region}"
}`;

    // Generate resources
    resources.forEach((resource) => {
      tf += `
resource "${provider}_${resource.type}" "${resource.name}" {
${Object.entries(resource.config)
  .map(([key, value]) => `  ${key} = ${this.formatHclValue(value)}`)
  .join('\n')}
}
`;
    });

    return tf;
  }

  // Generate AWS EC2 instance
  async generateEC2Instance(config: {
    name: string;
    instanceType: string;
    ami: string;
    region: string;
    tags?: Record<string, string>;
  }): Promise<string> {
    const terraformConfig: TerraformConfig = {
      provider: 'aws',
      region: config.region,
      resources: [
        {
          type: 'instance',
          name: config.name,
          config: {
            instance_type: config.instanceType,
            ami: config.ami,
            tags: config.tags || {},
          },
        },
      ],
    };

    return this.generate(terraformConfig);
  }

  // Generate AWS RDS instance
  async generateRDSInstance(config: {
    name: string;
    engine: string;
    instanceClass: string;
    region: string;
    username: string;
    skipFinalSnapshot?: boolean;
  }): Promise<string> {
    const terraformConfig: TerraformConfig = {
      provider: 'aws',
      region: config.region,
      resources: [
        {
          type: 'db_instance',
          name: config.name,
          config: {
            engine: config.engine,
            instance_class: config.instanceClass,
            allocated_storage: 20,
            username: config.username,
            skip_final_snapshot: config.skipFinalSnapshot ?? true,
          },
        },
      ],
    };

    return this.generate(terraformConfig);
  }
}
