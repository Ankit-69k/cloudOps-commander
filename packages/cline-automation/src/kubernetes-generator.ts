import { logger } from '@cloudops-commander/logger';
import { ClineClient } from './cline-client';
import YAML from 'yaml';
import type { KubernetesConfig, ClineTask } from './types';

export class KubernetesGenerator {
  private client: ClineClient;

  constructor(client?: ClineClient) {
    this.client = client || new ClineClient();
  }

  // Generate Kubernetes manifest using Cline
  async generate(config: KubernetesConfig): Promise<string> {
    logger.info({ kind: config.kind }, 'Generating Kubernetes manifest');

    const task: ClineTask = {
      id: `k8s-${Date.now()}`,
      type: 'kubernetes',
      description: `Generate a Kubernetes ${config.kind} manifest with the following specifications`,
      context: config,
      priority: 'high',
    };

    const response = await this.client.executeTask(task);

    if (!response.success) {
      throw new Error(`Kubernetes generation failed: ${response.error}`);
    }

    // Try to extract YAML from artifacts
    const yamlFile = response.artifacts?.files.find(
      (f) => f.path.endsWith('.yaml') || f.path.endsWith('.yml')
    );

    if (yamlFile) {
      return yamlFile.content;
    }

    // Fallback to manual generation
    return YAML.stringify(config);
  }

  // Generate Deployment manifest
  async generateDeployment(config: {
    name: string;
    namespace?: string;
    replicas: number;
    image: string;
    port: number;
    env?: Record<string, string>;
    labels?: Record<string, string>;
  }): Promise<string> {
    const k8sConfig: KubernetesConfig = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: config.name,
        namespace: config.namespace || 'default',
        labels: config.labels || { app: config.name },
      },
      spec: {
        replicas: config.replicas,
        selector: {
          matchLabels: { app: config.name },
        },
        template: {
          metadata: {
            labels: { app: config.name },
          },
          spec: {
            containers: [
              {
                name: config.name,
                image: config.image,
                ports: [{ containerPort: config.port }],
                env: Object.entries(config.env || {}).map(([name, value]) => ({
                  name,
                  value,
                })),
              },
            ],
          },
        },
      },
    };

    return this.generate(k8sConfig);
  }

  // Generate Service manifest
  async generateService(config: {
    name: string;
    namespace?: string;
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
    port: number;
    targetPort: number;
    selector?: Record<string, string>;
  }): Promise<string> {
    const k8sConfig: KubernetesConfig = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: config.name,
        namespace: config.namespace || 'default',
      },
      spec: {
        type: config.type,
        selector: config.selector || { app: config.name },
        ports: [
          {
            port: config.port,
            targetPort: config.targetPort,
            protocol: 'TCP',
          },
        ],
      },
    };

    return this.generate(k8sConfig);
  }

  // Generate Ingress manifest
  async generateIngress(config: {
    name: string;
    namespace?: string;
    host: string;
    serviceName: string;
    servicePort: number;
    tls?: boolean;
  }): Promise<string> {
    const k8sConfig: KubernetesConfig = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: config.name,
        namespace: config.namespace || 'default',
      },
      spec: {
        rules: [
          {
            host: config.host,
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: config.serviceName,
                      port: { number: config.servicePort },
                    },
                  },
                },
              ],
            },
          },
        ],
        ...(config.tls && {
          tls: [
            {
              hosts: [config.host],
              secretName: `${config.name}-tls`,
            },
          ],
        }),
      },
    };

    return this.generate(k8sConfig);
  }

  // Generate complete application stack (Deployment + Service + Ingress)
  async generateFullStack(config: {
    name: string;
    namespace?: string;
    replicas: number;
    image: string;
    port: number;
    host: string;
    serviceType?: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  }): Promise<{ deployment: string; service: string; ingress: string }> {
    const [deployment, service, ingress] = await Promise.all([
      this.generateDeployment({
        name: config.name,
        namespace: config.namespace,
        replicas: config.replicas,
        image: config.image,
        port: config.port,
      }),
      this.generateService({
        name: config.name,
        namespace: config.namespace,
        type: config.serviceType || 'ClusterIP',
        port: 80,
        targetPort: config.port,
      }),
      this.generateIngress({
        name: config.name,
        namespace: config.namespace,
        host: config.host,
        serviceName: config.name,
        servicePort: 80,
      }),
    ]);

    return { deployment, service, ingress };
  }
}
