import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { BhaComponent, BhaComponentType } from '../types';

interface CtBhaDesignerProps {
  components: BhaComponent[];
  onAdd: (component: Omit<BhaComponent, 'id' | 'job_id' | 'created_at' | 'updated_at'>) => void;
  onDelete: (componentId: string) => void;
}

const BHA_COMPONENT_TYPES: { value: BhaComponentType; label: string }[] = [
  { value: 'motor', label: 'Motor' },
  { value: 'bit', label: 'Bit' },
  { value: 'jar', label: 'Jar' },
  { value: 'sub', label: 'Sub' },
  { value: 'tool', label: 'Tool' },
  { value: 'other', label: 'Other' },
];

export function CtBhaDesigner({ components, onAdd, onDelete }: CtBhaDesignerProps) {
  const { t } = useTranslation('coiled-tubing');
  const [isAdding, setIsAdding] = useState(false);
  const [newComponent, setNewComponent] = useState<Partial<BhaComponent>>({
    component_type: 'tool',
    sequence_order: components.length + 1,
  });

  const handleAdd = () => {
    if (!newComponent.component_type) return;

    onAdd({
      component_type: newComponent.component_type,
      sequence_order: newComponent.sequence_order || components.length + 1,
      manufacturer: newComponent.manufacturer,
      model: newComponent.model,
      serial_number: newComponent.serial_number,
      outer_diameter_in: newComponent.outer_diameter_in,
      length_ft: newComponent.length_ft,
      weight_lbs: newComponent.weight_lbs,
      description: newComponent.description,
      notes: newComponent.notes,
    });

    setNewComponent({
      component_type: 'tool',
      sequence_order: components.length + 2,
    });
    setIsAdding(false);
  };

  const sortedComponents = [...components].sort((a, b) => a.sequence_order - b.sequence_order);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('jobs.bha_designer')}</CardTitle>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('jobs.add_component')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedComponents.map((component, index) => (
            <div
              key={component.id}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{component.component_type.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground">
                  {component.manufacturer} {component.model}
                  {component.outer_diameter_in && ` - OD: ${component.outer_diameter_in}"`}
                  {component.length_ft && ` - L: ${component.length_ft} ft`}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(component.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {isAdding && (
            <div className="rounded-lg border p-4 space-y-4 bg-accent/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t('jobs.component_type')}</Label>
                  <Select
                    value={newComponent.component_type}
                    onValueChange={(value) =>
                      setNewComponent({ ...newComponent, component_type: value as BhaComponentType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BHA_COMPONENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('common.manufacturer')}</Label>
                  <Input
                    value={newComponent.manufacturer || ''}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, manufacturer: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t('common.model')}</Label>
                  <Input
                    value={newComponent.model || ''}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, model: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t('common.serial_number')}</Label>
                  <Input
                    value={newComponent.serial_number || ''}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, serial_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t('jobs.outer_diameter')} (in)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newComponent.outer_diameter_in || ''}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, outer_diameter_in: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>{t('jobs.length')} (ft)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newComponent.length_ft || ''}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, length_ft: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd}>{t('common.add')}</Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}

          {components.length === 0 && !isAdding && (
            <div className="text-center text-muted-foreground py-8">
              {t('jobs.no_bha_components')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
