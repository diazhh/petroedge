/**
 * FormulaEditor Component
 * Editor for computed field formulas with syntax highlighting and validation
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { useValidateFormula } from '../api/computed-fields.api';

interface FormulaEditorProps {
  value: string;
  onChange: (value: string) => void;
  assetTypeId: string;
  availableVariables?: string[];
  error?: string;
}

export function FormulaEditor({ 
  value, 
  onChange, 
  assetTypeId,
  availableVariables = [],
  error 
}: FormulaEditorProps) {
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null);
  const validateFormula = useValidateFormula();

  const handleValidate = async () => {
    try {
      const result = await validateFormula.mutateAsync({ assetTypeId, formula: value });
      setValidationResult({ valid: true, message: result.data?.message });
    } catch (err: any) {
      setValidationResult({ 
        valid: false, 
        message: err.response?.data?.error?.message || 'Fórmula inválida' 
      });
    }
  };

  const insertVariable = (variable: string) => {
    onChange(value + variable);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fórmula</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleValidate}
            disabled={!value || validateFormula.isPending}
          >
            {validateFormula.isPending ? 'Validando...' : 'Validar Fórmula'}
          </Button>
        </div>
        
        <Textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setValidationResult(null);
          }}
          placeholder="ej: telemetry.oilRate + telemetry.waterRate"
          className="font-mono text-sm"
          rows={4}
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {validationResult && (
          <div className={`flex items-center gap-2 text-sm ${validationResult.valid ? 'text-green-600' : 'text-destructive'}`}>
            {validationResult.valid ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>{validationResult.message}</span>
          </div>
        )}
      </div>

      {/* Available Variables */}
      {availableVariables.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                <span>Variables Disponibles</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click en una variable para insertarla en la fórmula
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formula Help */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <h4 className="font-medium">Operadores Soportados</h4>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div><code className="bg-muted px-1 rounded">+</code> Suma</div>
              <div><code className="bg-muted px-1 rounded">-</code> Resta</div>
              <div><code className="bg-muted px-1 rounded">*</code> Multiplicación</div>
              <div><code className="bg-muted px-1 rounded">/</code> División</div>
              <div><code className="bg-muted px-1 rounded">^</code> Potencia</div>
              <div><code className="bg-muted px-1 rounded">%</code> Módulo</div>
            </div>
            <h4 className="font-medium mt-4">Funciones Matemáticas</h4>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div><code className="bg-muted px-1 rounded">sqrt(x)</code> Raíz cuadrada</div>
              <div><code className="bg-muted px-1 rounded">abs(x)</code> Valor absoluto</div>
              <div><code className="bg-muted px-1 rounded">max(a,b)</code> Máximo</div>
              <div><code className="bg-muted px-1 rounded">min(a,b)</code> Mínimo</div>
              <div><code className="bg-muted px-1 rounded">round(x)</code> Redondear</div>
              <div><code className="bg-muted px-1 rounded">log(x)</code> Logaritmo</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
