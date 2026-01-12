import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CanDo } from '@/components/common/PermissionGate';
import type { CtReelSection } from '../types';

interface CtReelSectionsTableProps {
  sections: CtReelSection[];
  onDelete?: (section: CtReelSection) => void;
}

export function CtReelSectionsTable({ sections, onDelete }: CtReelSectionsTableProps) {
  const { t } = useTranslation('coiled-tubing');

  const getFatigueColor = (percentage: number) => {
    if (percentage >= 80) return 'destructive';
    if (percentage >= 60) return 'warning';
    return 'default';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('reels.section_number')}</TableHead>
            <TableHead>{t('reels.start_depth')}</TableHead>
            <TableHead>{t('reels.end_depth')}</TableHead>
            <TableHead>{t('reels.length')}</TableHead>
            <TableHead>{t('reels.fatigue')}</TableHead>
            <TableHead>{t('reels.runs')}</TableHead>
            <TableHead>{t('reels.hours')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                {t('reels.no_sections')}
              </TableCell>
            </TableRow>
          ) : (
            sections.map((section) => (
              <TableRow key={section.id}>
                <TableCell className="font-medium">
                  {section.section_number}
                </TableCell>
                <TableCell>{section.start_depth_ft.toFixed(0)} ft</TableCell>
                <TableCell>{section.end_depth_ft.toFixed(0)} ft</TableCell>
                <TableCell>{section.length_ft.toFixed(0)} ft</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={getFatigueColor(section.fatigue_percentage)}>
                      {section.fatigue_percentage.toFixed(1)}%
                    </Badge>
                    {section.fatigue_percentage >= 80 && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{section.runs_count}</TableCell>
                <TableCell>{section.hours_count.toFixed(1)} hrs</TableCell>
                <TableCell>
                  {section.is_cut ? (
                    <Badge variant="secondary">
                      {t('reels.cut')} - {section.cut_date ? new Date(section.cut_date).toLocaleDateString() : ''}
                    </Badge>
                  ) : (
                    <Badge variant="default">{t('reels.active')}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!section.is_cut && onDelete && (
                    <CanDo permission="coiled-tubing:reels:delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(section)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CanDo>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
