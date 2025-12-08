# CloudOps Commander

**CloudOps Commander** is an intelligent DevOps platform that manages cloud infrastructure, monitors system health, and automatically responds to incidents.

It combines **AI-powered incident response** with **infrastructure-as-code** and **workflow automation** using:

- **Cline CLI** – Infrastructure automation & code generation (Terraform, Kubernetes, Docker, scripts)
- **Kestra** – Workflow engine for observability and auto-remediation
- **Oumi** – Fine-tuned incident response model (GRPO-based training)
- **Vercel** – Frontend operations dashboard
- **CodeRabbit** – Automated infrastructure & DevOps code reviews
- **Turborepo + TypeScript** – Monorepo and build system

---

## ✨ Core Capabilities

- 🔧 **Infrastructure-as-Code Automation**
  - Use **Cline CLI** tools to generate and update:
    - Terraform configs
    - Kubernetes manifests
    - Docker Compose files
    - Deployment scripts
  - Integrate Cline into CI/CD pipelines to keep infra in sync with application changes.

- 🧠 **AI-Assisted Incident Response**
  - Kestra workflows orchestrate observability sources (CloudWatch, Kubernetes events, Sentry, Datadog, etc.).
  - **Oumi**-powered agents answer questions like:
    - "Is this a real incident or a false alarm?"
    - "Should we scale up or down resources?"
    - "Should we trigger auto-remediation?"
    - "Do we need to page the on-call engineer?"

- 📊 **Operations Dashboard (Vercel)**
  - Real-time infrastructure status
  - AI-generated incident summaries
  - Cost optimization suggestions
  - Health metrics & historical trends

- ✅ **Guardrails & Quality via CodeRabbit**
  - Reviews infra code, deployment scripts, and workflow definitions
  - Enforces DevOps best practices & security checks

---

## 🏗 Monorepo Structure

This repository is a **Turborepo** monorepo using **TypeScript**.

```bash
cloudops-commander/
├── apps/
│   ├── frontend/          # Next.js dashboard (deployed to Vercel)
│   └── api/               # Backend API + orchestration layer
├── packages/
│   ├── ui/                # Shared UI components
│   ├── config/            # Shared TypeScript config, ESLint, etc.
│   └── utils/             # Shared utilities & types
├── infra/
│   ├── cline-automation/  # Cline CLI tools and presets for IaC generation
│   ├── terraform/         # Base Terraform modules and environments
│   ├── k8s/               # Kubernetes manifests & Helm charts
│   └── kestra/            # Kestra workflows for incidents & remediation
└── README.md
```
