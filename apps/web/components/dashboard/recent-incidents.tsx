import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const incidents = [
  {
    id: '1',
    title: 'High Latency in US-East',
    severity: 'high',
    status: 'investigating',
    time: '10m ago',
  },
  {
    id: '2',
    title: 'Database Connection Timeout',
    severity: 'critical',
    status: 'open',
    time: '45m ago',
  },
  {
    id: '3',
    title: 'Pod Restart Loop',
    severity: 'medium',
    status: 'resolved',
    time: '2h ago',
  },
];

export function RecentIncidents() {
  return (
    <Card className="col-span-3 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Incidents</CardTitle>
        <CardDescription>Latest alerts and issues requiring attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {incidents.map((incident) => (
            <div key={incident.id} className="flex items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">{incident.title}</p>
                  <Badge
                    variant={
                      incident.severity === 'critical'
                        ? 'destructive'
                        : incident.severity === 'high'
                          ? 'default' // Map high to default (primary) or add custom variant
                          : 'secondary'
                    }
                    className="text-[10px] px-1 py-0 h-5"
                  >
                    {incident.severity}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {incident.time}
                  <span className="mx-2">•</span>
                  <span className="capitalize">{incident.status}</span>
                </div>
              </div>
              <div className="ml-auto font-medium">
                {incident.status === 'resolved' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
