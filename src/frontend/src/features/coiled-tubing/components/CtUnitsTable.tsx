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
import type { CtUnit } from '../types';
import { CT_UNIT_STATUS_COLORS } from '../constants';
import { CanDo } from '@/components/common/PermissionGate';

interface CtUnitsTableProps {
  units: CtUnit[];
  onEdit?: (unit: CtUnit) => void;
  onDelete?: (unit: CtUnit) => void;
}

export function CtUnitsTable({ units, onEdit, onDelete }: CtUnitsTableProps) {
  const { t } = useTranslation('coiled-tubing');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('units.unit_number')}</TableHead>
            <TableHead>{t('units.manufacturer')}</TableHead>
            <TableHead>{t('units.model')}</TableHead>
            <TableHead>{t('units.status')}</TableHead>
            <TableHead>{t('units.max_pressure')}</TableHead>
            <TableHead>{t('units.current_location')}</TableHead>
            <TableHead className="text-right">{t('actions.view')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {t('common.no_data')}
              </TableCell>
            </TableRow>
          ) : (
            units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/coiled-tubing/units/${unit.id}`}
                    className="hover:underline"
                  >
                    {unit.unit_number}
                  </Link>
                </TableCell>
                <TableCell>{unit.manufacturer}</TableCell>
                <TableCell>{unit.model}</TableCell>
                <TableCell>
                  <Badge className={CT_UNIT_STATUS_COLORS[unit.status]}>
                    {t(`units.status_${unit.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>{unit.max_pressure_psi.toLocaleString()} PSI</TableCell>
                <TableCell>{unit.current_location || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/coiled-tubing/units/${unit.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <CanDo permission="coiled-tubing:units:update">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(unit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CanDo>
                    <CanDo permission="coiled-tubing:units:delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(unit)}
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
