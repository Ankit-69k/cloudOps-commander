'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Play, Clock, CheckCircle2, XCircle } from 'lucide-react';

// Mock Data
const workflows = [
  {
    id: 'wf-001',
    name: 'auto-scale-cluster',
    type: 'scaling',
    schedule: '*/5 * * * *',
    lastRun: '2023-10-25T10:35:00Z',
    status: 'success',
    enabled: true,
  },
  {
    id: 'wf-002',
    name: 'daily-backup-rds',
    type: 'backup',
    schedule: '0 0 * * *',
    lastRun: '2023-10-25T00:00:00Z',
    status: 'success',
    enabled: true,
  },
  {
    id: 'wf-003',
    name: 'incident-triage',
    type: 'incident-response',
    schedule: 'event-driven',
    lastRun: '2023-10-25T09:15:00Z',
    status: 'failed',
    enabled: true,
  },
  {
    id: 'wf-004',
    name: 'provision-staging-env',
    type: 'provisioning',
    schedule: 'manual',
    lastRun: '2023-10-24T15:00:00Z',
    status: 'success',
    enabled: false,
  },
];

const recentExecutions = [
  {
    id: 'exec-101',
    workflowId: 'wf-001',
    name: 'auto-scale-cluster',
    status: 'success',
    duration: '45s',
    startedAt: '2023-10-25T10:35:00Z',
  },
  {
    id: 'exec-102',
    workflowId: 'wf-003',
    name: 'incident-triage',
    status: 'failed',
    duration: '12s',
    startedAt: '2023-10-25T09:15:00Z',
  },
  {
    id: 'exec-103',
    workflowId: 'wf-002',
    name: 'daily-backup-rds',
    status: 'success',
    duration: '15m 20s',
    startedAt: '2023-10-25T00:00:00Z',
  },
];

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorkflows = workflows.filter((wf) =>
    wf.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">Manage and monitor Kestra automation workflows.</p>
        </div>
        <Button className="gap-2">
          <Play className="h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <Tabs defaultValue="definitions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map((wf) => (
                  <TableRow key={wf.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            wf.enabled ? 'bg-green-500' : 'bg-muted-foreground'
                          }`}
                        />
                        {wf.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{wf.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{wf.schedule}</TableCell>
                    <TableCell>{new Date(wf.lastRun).toLocaleString()}</TableCell>
                    <TableCell>
                      {wf.status === 'success' ? (
                        <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/25">
                          Success
                        </Badge>
                      ) : wf.status === 'failed' ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : (
                        <Badge variant="secondary">Unknown</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent workflow runs and their outcomes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentExecutions.map((exec) => (
                  <div key={exec.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{exec.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(exec.startedAt).toLocaleString()}
                        <span className="mx-2">•</span>
                        Duration: {exec.duration}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {exec.status === 'success' ? (
                        <>
                          <span className="text-sm text-green-500">Success</span>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-red-500">Failed</span>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
