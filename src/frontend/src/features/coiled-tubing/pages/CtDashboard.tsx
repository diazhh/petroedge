import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Cable, Database, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CanDo } from '@/components/common/PermissionGate';

export function CtDashboard() {
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: t('module_name') },
  ];

  const stats = [
    {
      title: t('units.title'),
      value: '12',
      description: t('dashboard.active_units', '8 activas'),
      icon: Cable,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/coiled-tubing/units',
      permission: 'coiled-tubing:units:read',
    },
    {
      title: t('reels.title'),
      value: '45',
      description: t('dashboard.available_reels', '32 disponibles'),
      icon: Database,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/coiled-tubing/reels',
      permission: 'coiled-tubing:reels:read',
    },
    {
      title: t('jobs.title'),
      value: '8',
      description: t('dashboard.active_jobs', '5 en progreso'),
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/coiled-tubing/jobs',
      permission: 'coiled-tubing:jobs:read',
    },
    {
      title: t('dashboard.utilization', 'Utilización'),
      value: '67%',
      description: t('dashboard.avg_utilization', 'Promedio mensual'),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '#',
      permission: 'coiled-tubing:reports:view',
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('module_name')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.description', 'Gestión de operaciones de Coiled Tubing')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <CanDo key={stat.title} permission={stat.permission}>
            <Card
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => stat.href !== '#' && navigate(stat.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </CanDo>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CanDo permission="coiled-tubing:units:read">
          <Card>
            <CardHeader>
              <CardTitle>{t('units.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('dashboard.units_description', 'Gestión de unidades de Coiled Tubing')}
              </p>
              <Button onClick={() => navigate('/coiled-tubing/units')} className="w-full">
                {t('dashboard.view_units', 'Ver Unidades')}
              </Button>
            </CardContent>
          </Card>
        </CanDo>

        <CanDo permission="coiled-tubing:reels:read">
          <Card>
            <CardHeader>
              <CardTitle>{t('reels.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('dashboard.reels_description', 'Gestión de carretes y análisis de fatiga')}
              </p>
              <Button onClick={() => navigate('/coiled-tubing/reels')} className="w-full">
                {t('dashboard.view_reels', 'Ver Carretes')}
              </Button>
            </CardContent>
          </Card>
        </CanDo>

        <CanDo permission="coiled-tubing:jobs:read">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobs.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('dashboard.jobs_description', 'Planificación y monitoreo de trabajos')}
              </p>
              <Button onClick={() => navigate('/coiled-tubing/jobs')} className="w-full">
                {t('dashboard.view_jobs', 'Ver Trabajos')}
              </Button>
            </CardContent>
          </Card>
        </CanDo>
      </div>
    </div>
  );
}
