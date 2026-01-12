import { useTranslation } from 'react-i18next';
import { FileText, Download, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CtJob } from '../types';

interface CtJobTicketViewerProps {
  job: CtJob;
}

export function CtJobTicketViewer({ job }: CtJobTicketViewerProps) {
  const { t } = useTranslation('coiled-tubing');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log('Download job ticket:', job.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>{t('jobs.job_ticket')}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              {t('common.print')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              {t('common.download')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">COILED TUBING JOB TICKET</h1>
          <p className="text-muted-foreground">Job #{job.job_number}</p>
          <Badge variant="default">{job.status.toUpperCase()}</Badge>
        </div>

        <Separator />

        {/* Job Information */}
        <div>
          <h3 className="font-semibold mb-3">{t('jobs.job_information')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('jobs.job_type')}:</span>
              <span className="ml-2 font-medium">{job.job_type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('jobs.status')}:</span>
              <span className="ml-2 font-medium">{job.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('jobs.planned_start')}:</span>
              <span className="ml-2 font-medium">
                {job.planned_start_date ? new Date(job.planned_start_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('jobs.planned_end')}:</span>
              <span className="ml-2 font-medium">
                {job.planned_end_date ? new Date(job.planned_end_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Equipment */}
        <div>
          <h3 className="font-semibold mb-3">{t('jobs.equipment')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('units.title')}:</span>
              <span className="ml-2 font-medium">{job.unit?.unit_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('reels.title')}:</span>
              <span className="ml-2 font-medium">{job.reel?.reel_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Objectives */}
        {job.objectives && (
          <>
            <div>
              <h3 className="font-semibold mb-3">{t('jobs.objectives')}</h3>
              <p className="text-sm whitespace-pre-wrap">{job.objectives}</p>
            </div>
            <Separator />
          </>
        )}

        {/* Results */}
        {job.results && (
          <>
            <div>
              <h3 className="font-semibold mb-3">{t('jobs.results')}</h3>
              <p className="text-sm whitespace-pre-wrap">{job.results}</p>
            </div>
            <Separator />
          </>
        )}

        {/* Performance Summary */}
        {job.status === 'completed' && (
          <>
            <div>
              <h3 className="font-semibold mb-3">{t('jobs.performance_summary')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('jobs.max_depth')}:</span>
                  <span className="ml-2 font-medium">{job.max_depth_reached_ft?.toFixed(0) || 'N/A'} ft</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('jobs.max_pressure')}:</span>
                  <span className="ml-2 font-medium">{job.max_pressure_psi?.toFixed(0) || 'N/A'} psi</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('jobs.max_weight')}:</span>
                  <span className="ml-2 font-medium">{job.max_weight_lbs?.toFixed(0) || 'N/A'} lbs</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('jobs.total_fluid')}:</span>
                  <span className="ml-2 font-medium">{job.total_fluid_pumped_bbl?.toFixed(0) || 'N/A'} bbl</span>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Signatures */}
        <div>
          <h3 className="font-semibold mb-3">{t('jobs.signatures')}</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="border-t border-foreground pt-2">
                <p className="text-sm font-medium">{t('jobs.ct_supervisor')}</p>
                <p className="text-xs text-muted-foreground">{t('common.signature')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-t border-foreground pt-2">
                <p className="text-sm font-medium">{t('jobs.company_representative')}</p>
                <p className="text-xs text-muted-foreground">{t('common.signature')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Generated on {new Date().toLocaleString()}</p>
          <p>PetroEdge SCADA+ERP System</p>
        </div>
      </CardContent>
    </Card>
  );
}
