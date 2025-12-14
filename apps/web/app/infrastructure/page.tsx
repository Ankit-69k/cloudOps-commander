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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, Filter } from 'lucide-react';

// Mock Data based on Infrastructure type
const resources = [
  {
    id: '1',
    name: 'prod-api-cluster',
    type: 'kubernetes',
    provider: 'aws',
    region: 'us-east-1',
    status: 'active',
    cpu: '45%',
    memory: '62%',
    cost: '$1,240/mo',
  },
  {
    id: '2',
    name: 'primary-db-rds',
    type: 'database',
    provider: 'aws',
    region: 'us-east-1',
    status: 'active',
    cpu: '28%',
    memory: '45%',
    cost: '$850/mo',
  },
  {
    id: '3',
    name: 'assets-bucket',
    type: 'storage',
    provider: 'aws',
    region: 'us-east-1',
    status: 'active',
    cpu: '-',
    memory: '-',
    cost: '$120/mo',
  },
  {
    id: '4',
    name: 'worker-node-pool',
    type: 'compute',
    provider: 'gcp',
    region: 'us-central1',
    status: 'warning',
    cpu: '88%',
    memory: '92%',
    cost: '$600/mo',
  },
  {
    id: '5',
    name: 'cache-redis',
    type: 'database',
    provider: 'azure',
    region: 'eastus',
    status: 'active',
    cpu: '12%',
    memory: '30%',
    cost: '$240/mo',
  },
];

export default function InfrastructurePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResources = resources.filter((resource) =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infrastructure</h1>
          <p className="text-muted-foreground">Manage your cloud resources across all providers.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>CPU</TableHead>
              <TableHead>Memory</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell className="font-medium">{resource.name}</TableCell>
                <TableCell className="capitalize">{resource.type}</TableCell>
                <TableCell className="uppercase">{resource.provider}</TableCell>
                <TableCell>{resource.region}</TableCell>
                <TableCell>
                  <Badge
                    variant={resource.status === 'active' ? 'default' : 'destructive'}
                    className={
                      resource.status === 'active'
                        ? 'bg-green-500/15 text-green-500 hover:bg-green-500/25'
                        : resource.status === 'warning'
                          ? 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25'
                          : ''
                    }
                  >
                    {resource.status}
                  </Badge>
                </TableCell>
                <TableCell>{resource.cpu}</TableCell>
                <TableCell>{resource.memory}</TableCell>
                <TableCell>{resource.cost}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>View metrics</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Terminate resource
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
