'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { time: '00:00', value: 85 },
  { time: '01:00', value: 88 },
  { time: '02:00', value: 92 },
  { time: '03:00', value: 90 },
  { time: '04:00', value: 85 },
  { time: '05:00', value: 82 },
  { time: '06:00', value: 88 },
  { time: '07:00', value: 95 },
  { time: '08:00', value: 98 },
  { time: '09:00', value: 92 },
  { time: '10:00', value: 88 },
  { time: '11:00', value: 94 },
];

export function HealthChart() {
  return (
    <Card className="col-span-4 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Overall system performance over the last 12 hours</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
