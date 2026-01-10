import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Droplet, Gauge, TrendingUp } from 'lucide-react';
import {
  useWellTest,
  useIprAnalyses,
  useVlpAnalyses,
  useNodalAnalyses,
} from '../features/well-testing/api/wellTestingApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { IprVlpChart } from '../features/well-testing/components/IprVlpChart';
import type { TestStatus } from '../features/well-testing/types';

const statusColors: Record<TestStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ANALYZED: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-gray-100 text-gray-800',
};

export default function WellTestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const { data: test, isLoading: isLoadingTest } = useWellTest(testId!);
  
  const { data: iprAnalyses = [] } = useIprAnalyses(test?.wellId || '');
  const { data: vlpAnalyses = [] } = useVlpAnalyses(test?.wellId || '');
  const { data: nodalAnalyses = [] } = useNodalAnalyses(test?.wellId || '');

  // Obtener el análisis más reciente de cada tipo
  const latestIpr = iprAnalyses[0];
  const latestVlp = vlpAnalyses[0];
  const latestNodal = nodalAnalyses[0];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('es-VE', { maximumFractionDigits: 2 });
  };

  if (isLoadingTest) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Well Test Not Found</h2>
          <Button onClick={() => navigate('/well-tests')} className="mt-4">
            Back to Well Tests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/well-tests')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{test.testNumber}</h1>
            <p className="text-muted-foreground">
              {test.well?.name} ({test.well?.code})
            </p>
          </div>
          <Badge className={statusColors[test.status]}>{test.status}</Badge>
        </div>
      </div>

      {/* Test Information Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(test.testDate)}</div>
            {test.durationHours && (
              <p className="text-xs text-muted-foreground">
                Duration: {test.durationHours} hours
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oil Rate</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(test.oilRateBopd)}</div>
            <p className="text-xs text-muted-foreground">BOPD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Cut</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(test.waterCutPercent)}</div>
            <p className="text-xs text-muted-foreground">%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flowing BHP</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(test.flowingBhpPsi)}</div>
            <p className="text-xs text-muted-foreground">psi</p>
          </CardContent>
        </Card>
      </div>

      {/* IPR & VLP Chart */}
      {(latestIpr || latestVlp) && (
        <IprVlpChart
          iprAnalysis={latestIpr}
          vlpAnalysis={latestVlp}
          nodalAnalysis={latestNodal}
        />
      )}

      {/* Test Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Production Data</CardTitle>
            <CardDescription>Rates and fluid properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Oil Rate:</span>
              <span className="text-sm font-medium">{formatNumber(test.oilRateBopd)} BOPD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Water Rate:</span>
              <span className="text-sm font-medium">{formatNumber(test.waterRateBwpd)} BWPD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gas Rate:</span>
              <span className="text-sm font-medium">{formatNumber(test.gasRateMscfd)} MSCFD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Water Cut:</span>
              <span className="text-sm font-medium">{formatNumber(test.waterCutPercent)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">GOR:</span>
              <span className="text-sm font-medium">{formatNumber(test.gorScfStb)} SCF/STB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Oil API:</span>
              <span className="text-sm font-medium">{formatNumber(test.oilApiGravity)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gas SG:</span>
              <span className="text-sm font-medium">{formatNumber(test.gasSpecificGravity)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pressure & Temperature</CardTitle>
            <CardDescription>Wellbore conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Flowing BHP:</span>
              <span className="text-sm font-medium">{formatNumber(test.flowingBhpPsi)} psi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Static BHP:</span>
              <span className="text-sm font-medium">{formatNumber(test.staticBhpPsi)} psi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tubing Pressure:</span>
              <span className="text-sm font-medium">{formatNumber(test.tubingPressurePsi)} psi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Casing Pressure:</span>
              <span className="text-sm font-medium">{formatNumber(test.casingPressurePsi)} psi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Wellhead Temp:</span>
              <span className="text-sm font-medium">{formatNumber(test.wellheadTempF)}°F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bottomhole Temp:</span>
              <span className="text-sm font-medium">{formatNumber(test.bottomholeTempF)}°F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Separator Pressure:</span>
              <span className="text-sm font-medium">{formatNumber(test.separatorPressurePsi)} psi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Separator Temp:</span>
              <span className="text-sm font-medium">{formatNumber(test.separatorTemperatureF)}°F</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {test.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{test.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis History */}
      {(iprAnalyses.length > 0 || vlpAnalyses.length > 0 || nodalAnalyses.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis History</CardTitle>
            <CardDescription>IPR, VLP, and Nodal analyses performed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {iprAnalyses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">IPR Analyses ({iprAnalyses.length})</h4>
                <div className="space-y-1">
                  {iprAnalyses.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="text-xs text-muted-foreground flex justify-between">
                      <span>{analysis.model} - {formatDate(analysis.analysisDate)}</span>
                      <span>Qmax: {formatNumber(analysis.qmaxBopd)} BOPD</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vlpAnalyses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">VLP Analyses ({vlpAnalyses.length})</h4>
                <div className="space-y-1">
                  {vlpAnalyses.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="text-xs text-muted-foreground flex justify-between">
                      <span>{analysis.correlation} - {formatDate(analysis.analysisDate)}</span>
                      <span>Tubing: {analysis.tubingIdInches}" @ {analysis.tubingDepthFt} ft</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nodalAnalyses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Nodal Analyses ({nodalAnalyses.length})</h4>
                <div className="space-y-1">
                  {nodalAnalyses.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="text-xs text-muted-foreground flex justify-between">
                      <span>{formatDate(analysis.analysisDate)}</span>
                      <span>Operating: {analysis.operatingRateBopd} BOPD @ {analysis.operatingPwfPsi} psi</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
