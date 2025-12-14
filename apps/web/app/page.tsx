import { Activity, AlertTriangle, CheckCircle, Server } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { HealthChart } from '@/components/dashboard/health-chart';
import { RecentIncidents } from '@/components/dashboard/recent-incidents';

export default function Home() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your cloud infrastructure and system health.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="System Health"
          value="98.2%"
          icon={Activity}
          trend={{ value: 2.1, label: 'from last week', direction: 'up' }}
        />
        <MetricCard
          title="Active Incidents"
          value="3"
          icon={AlertTriangle}
          trend={{ value: 1, label: 'new since yesterday', direction: 'down' }}
        />
        <MetricCard
          title="Active Resources"
          value="1,234"
          icon={Server}
          trend={{ value: 12, label: 'new resources', direction: 'up' }}
        />
        <MetricCard
          title="Workflows Run"
          value="842"
          icon={CheckCircle}
          trend={{ value: 8, label: 'increase', direction: 'up' }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <HealthChart />
        <RecentIncidents />
      </div>
    </div>
  );
}
