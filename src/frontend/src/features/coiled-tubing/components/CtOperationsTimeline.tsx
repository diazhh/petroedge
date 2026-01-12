import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JobOperation } from '../types';

interface CtOperationsTimelineProps {
  operations: JobOperation[];
}

export function CtOperationsTimeline({ operations }: CtOperationsTimelineProps) {
  const { t } = useTranslation('coiled-tubing');

  const sortedOperations = [...operations].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (start: string, end?: string) => {
    if (!end) return t('jobs.in_progress');
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('jobs.operations_timeline')}</CardTitle>
      </CardHeader>
      <CardContent>
        {operations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('jobs.no_operations')}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOperations.map((operation, index) => (
              <div key={operation.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                    {operation.end_time ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  {index < sortedOperations.length - 1 && (
                    <div className="h-full w-0.5 bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{operation.operation_type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {operation.description}
                      </p>
                    </div>
                    <Badge variant={operation.end_time ? 'default' : 'secondary'}>
                      {getDuration(operation.start_time, operation.end_time)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {formatTime(operation.start_time)}
                    </div>
                    {operation.depth_ft && (
                      <div>Depth: {operation.depth_ft.toFixed(0)} ft</div>
                    )}
                    {operation.pressure_psi && (
                      <div>Pressure: {operation.pressure_psi.toFixed(0)} psi</div>
                    )}
                    {operation.weight_lbs && (
                      <div>Weight: {operation.weight_lbs.toFixed(0)} lbs</div>
                    )}
                    {operation.flow_rate_bpm && (
                      <div>Flow: {operation.flow_rate_bpm.toFixed(1)} bpm</div>
                    )}
                  </div>
                  {operation.notes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      {operation.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
