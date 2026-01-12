import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Gauge, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RealtimeData {
  timestamp: string;
  depth_ft: number;
  pressure_psi: number;
  weight_lbs: number;
  flow_rate_bpm: number;
  speed_fpm: number;
}

interface CtRealtimeDashboardProps {
  jobId: string;
}

export function CtRealtimeDashboard({ jobId }: CtRealtimeDashboardProps) {
  const { t } = useTranslation('coiled-tubing');
  const [data, setData] = useState<RealtimeData[]>([]);
  const [currentData, setCurrentData] = useState<RealtimeData | null>(null);

  // Simulated real-time data (replace with actual WebSocket connection)
  useEffect(() => {
    const interval = setInterval(() => {
      const newData: RealtimeData = {
        timestamp: new Date().toISOString(),
        depth_ft: Math.random() * 10000,
        pressure_psi: Math.random() * 5000,
        weight_lbs: Math.random() * 15000,
        flow_rate_bpm: Math.random() * 10,
        speed_fpm: Math.random() * 100,
      };

      setCurrentData(newData);
      setData((prev) => [...prev.slice(-50), newData]);
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  const stats = [
    {
      title: t('jobs.depth'),
      value: currentData?.depth_ft.toFixed(0) || '0',
      unit: 'ft',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('jobs.pressure'),
      value: currentData?.pressure_psi.toFixed(0) || '0',
      unit: 'psi',
      icon: Gauge,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: t('jobs.weight'),
      value: currentData?.weight_lbs.toFixed(0) || '0',
      unit: 'lbs',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('jobs.flow_rate'),
      value: currentData?.flow_rate_bpm.toFixed(1) || '0',
      unit: 'bpm',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('jobs.realtime_monitor')}</h2>
        <Badge variant="default" className="animate-pulse">
          <Activity className="mr-1 h-3 w-3" />
          {t('jobs.live')}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value} <span className="text-sm font-normal text-muted-foreground">{stat.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('jobs.weight_vs_depth')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis yAxisId="left" label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Depth (ft)', angle: 90, position: 'insideRight' }} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => value.toFixed(1)}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="weight_lbs"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                name="Weight (lbs)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="depth_ft"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="Depth (ft)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('jobs.pressure_trend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis label={{ value: 'Pressure (psi)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => value.toFixed(0)}
              />
              <Line
                type="monotone"
                dataKey="pressure_psi"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                name="Pressure (psi)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
