import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { CtReel } from '../types';
import { CT_REEL_STATUS_COLORS, FATIGUE_THRESHOLDS, FATIGUE_COLORS } from '../constants';
import { CanDo } from '@/components/common/PermissionGate';
import { cn } from '@/lib/utils';

interface CtReelsTableProps {
  reels: CtReel[];
  onEdit?: (reel: CtReel) => void;
  onDelete?: (reel: CtReel) => void;
}

function getFatigueColor(fatigue: number): string {
  if (fatigue >= FATIGUE_THRESHOLDS.CRITICAL) return FATIGUE_COLORS.CRITICAL;
  if (fatigue >= FATIGUE_THRESHOLDS.HIGH) return FATIGUE_COLORS.HIGH;
  if (fatigue >= FATIGUE_THRESHOLDS.MEDIUM) return FATIGUE_COLORS.MEDIUM;
  return FATIGUE_COLORS.LOW;
}

export function CtReelsTable({ reels, onEdit, onDelete }: CtReelsTableProps) {
  const { t } = useTranslation('coiled-tubing');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('reels.reel_number')}</TableHead>
            <TableHead>{t('reels.manufacturer')}</TableHead>
            <TableHead>{t('reels.status')}</TableHead>
            <TableHead>{t('reels.total_length')}</TableHead>
            <TableHead>{t('reels.fatigue_percentage')}</TableHead>
            <TableHead>{t('reels.current_unit')}</TableHead>
            <TableHead className="text-right">{t('actions.view')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {t('common.no_data')}
              </TableCell>
            </TableRow>
          ) : (
            reels.map((reel) => (
              <TableRow key={reel.id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/coiled-tubing/reels/${reel.id}`}
                    className="hover:underline"
                  >
                    {reel.reel_number}
                  </Link>
                </TableCell>
                <TableCell>{reel.manufacturer}</TableCell>
                <TableCell>
                  <Badge className={CT_REEL_STATUS_COLORS[reel.status]}>
                    {t(`reels.status_${reel.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>{reel.total_length_ft.toLocaleString()} ft</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className={cn("h-full transition-all", getFatigueColor(reel.fatigue_percentage))}
                        style={{ width: `${reel.fatigue_percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {reel.fatigue_percentage.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {reel.current_unit ? (
                    <Link
                      to={`/coiled-tubing/units/${reel.current_unit.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {reel.current_unit.unit_number}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/coiled-tubing/reels/${reel.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <CanDo permission="coiled-tubing:reels:update">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(reel)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CanDo>
                    <CanDo permission="coiled-tubing:reels:delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(reel)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CanDo>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
