import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMagnitudes } from '@/features/magnitudes/api/magnitudes.api';
import { useUnits, useConvertUnits } from '../api/units.api';

export function UnitConverter() {
  const [magnitudeId, setMagnitudeId] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [fromUnitId, setFromUnitId] = useState<string>('');
  const [toUnitId, setToUnitId] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const { toast } = useToast();
  const { data: magnitudes } = useMagnitudes({ isActive: true });
  const { data: units } = useUnits({ 
    magnitudeId: magnitudeId || undefined, 
    isActive: true 
  });
  const convertUnits = useConvertUnits();

  const handleConvert = async () => {
    if (!value || !fromUnitId || !toUnitId) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos',
        variant: 'destructive',
      });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      toast({
        title: 'Error',
        description: 'El valor debe ser un número válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await convertUnits.mutateAsync({
        value: numValue,
        fromUnitId,
        toUnitId,
      });
      setResult(response.data.result);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al convertir unidades',
        variant: 'destructive',
      });
    }
  };

  const handleSwap = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
    setResult(null);
  };

  const fromUnit = units?.data?.find((u: any) => u.id === fromUnitId);
  const toUnit = units?.data?.find((u: any) => u.id === toUnitId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convertidor de Unidades</CardTitle>
        <CardDescription>
          Convierte valores entre diferentes unidades de medida
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Magnitud</label>
            <Select value={magnitudeId} onValueChange={(value) => {
              setMagnitudeId(value);
              setFromUnitId('');
              setToUnitId('');
              setResult(null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una magnitud" />
              </SelectTrigger>
              <SelectContent>
                {magnitudes?.data?.map((magnitude: any) => (
                  <SelectItem key={magnitude.id} value={magnitude.id}>
                    {magnitude.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {magnitudeId && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setResult(null);
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Desde</label>
                  <Select value={fromUnitId} onValueChange={(value) => {
                    setFromUnitId(value);
                    setResult(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidad origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.data?.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Hasta</label>
                  <Select value={toUnitId} onValueChange={(value) => {
                    setToUnitId(value);
                    setResult(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidad destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.data?.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleConvert} disabled={convertUnits.isPending}>
                  Convertir
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleSwap}
                  disabled={!fromUnitId || !toUnitId}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>

              {result !== null && fromUnit && toUnit && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Resultado:</p>
                  <p className="text-2xl font-bold">
                    {value} {fromUnit.symbol} = {result.toFixed(6)} {toUnit.symbol}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
