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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Search, Filter, Bot, Send, User } from 'lucide-react';

// Mock Data
const incidents = [
  {
    id: 'INC-001',
    title: 'High Latency in US-East',
    severity: 'high',
    status: 'investigating',
    detectedBy: 'monitoring',
    createdAt: '2023-10-25T10:30:00Z',
  },
  {
    id: 'INC-002',
    title: 'Database Connection Timeout',
    severity: 'critical',
    status: 'open',
    detectedBy: 'ai-agent',
    createdAt: '2023-10-25T09:15:00Z',
  },
  {
    id: 'INC-003',
    title: 'Pod Restart Loop',
    severity: 'medium',
    status: 'resolved',
    detectedBy: 'monitoring',
    createdAt: '2023-10-24T14:20:00Z',
  },
  {
    id: 'INC-004',
    title: 'S3 Bucket Access Denied',
    severity: 'low',
    status: 'closed',
    detectedBy: 'manual',
    createdAt: '2023-10-24T11:00:00Z',
  },
];

const chatHistory = [
  {
    role: 'ai',
    message:
      "I've detected a spike in latency in the us-east-1 region. It seems to be related to the recent deployment of the 'payment-service'.",
  },
  {
    role: 'user',
    message: 'Can you rollback the deployment?',
  },
  {
    role: 'ai',
    message:
      "I can initiate a rollback for 'payment-service' to version v1.2.3. This will take approximately 2 minutes. Shall I proceed?",
  },
];

export default function IncidentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIncidents = incidents.filter((incident) =>
    incident.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">
            Monitor and resolve system incidents with AI assistance.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detected By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">{incident.id}</TableCell>
                <TableCell>{incident.title}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      incident.severity === 'critical'
                        ? 'destructive'
                        : incident.severity === 'high'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {incident.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {incident.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{incident.detectedBy}</TableCell>
                <TableCell>{new Date(incident.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Bot className="h-4 w-4" />
                        Investigate
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="flex w-[400px] flex-col sm:w-[540px]">
                      <SheetHeader>
                        <SheetTitle>AI Investigation Assistant</SheetTitle>
                        <SheetDescription>
                          Collaborate with Oumi to resolve {incident.id}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex flex-1 flex-col gap-4 py-4">
                        <ScrollArea className="flex-1 rounded-md border p-4">
                          <div className="flex flex-col gap-4">
                            {chatHistory.map((msg, i) => (
                              <div
                                key={i}
                                className={`flex gap-3 ${
                                  msg.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <Avatar className="h-8 w-8">
                                  {msg.role === 'ai' ? (
                                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                                      <Bot className="h-4 w-4" />
                                    </div>
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-muted">
                                      <User className="h-4 w-4" />
                                    </div>
                                  )}
                                </Avatar>
                                <div
                                  className={`rounded-lg p-3 text-sm ${
                                    msg.role === 'ai'
                                      ? 'bg-muted'
                                      : 'bg-primary text-primary-foreground'
                                  }`}
                                >
                                  {msg.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="flex gap-2">
                          <Input placeholder="Ask Oumi about this incident..." />
                          <Button size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
