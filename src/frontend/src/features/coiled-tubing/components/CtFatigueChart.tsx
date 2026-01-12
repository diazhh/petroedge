import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CtReelSection } from '../types';

interface CtFatigueChartProps {
  sections: CtReelSection[];
}

export function CtFatigueChart({ sections }: CtFatigueChartProps) {
  const { t } = useTranslation('coiled-tubing');

  const chartData = sections
    .filter((s) => !s.is_cut)
    .map((section) => ({
      section: `S${section.section_number}`,
      depth: section.start_depth_ft,
      fatigue: section.fatigue_percentage,
      runs: section.runs_count,
      hours: section.hours_count,
    }))
    .sort((a, b) => a.depth - b.depth);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reels.fatigue_chart')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="section"
              label={{ value: t('reels.section'), position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: t('reels.fatigue') + ' (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{data.section}</span>
                          <span className="text-sm font-bold">{data.fatigue.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>Depth: {data.depth.toFixed(0)} ft</div>
                          <div>Runs: {data.runs}</div>
                          <div>Hours: {data.hours.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <ReferenceLine y={60} stroke="orange" strokeDasharray="3 3" label="Warning" />
            <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" label="Critical" />
            <Line
              type="monotone"
              dataKey="fatigue"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name={t('reels.fatigue')}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
