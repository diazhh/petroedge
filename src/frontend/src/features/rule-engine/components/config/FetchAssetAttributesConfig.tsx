import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useNodeConfig } from '../../hooks';
import type { FetchAssetAttributesConfig as FetchAssetAttributesConfigType } from '../../types';

interface FetchAssetAttributesConfigProps {
  nodeId: string;
}

export function FetchAssetAttributesConfig({ nodeId }: FetchAssetAttributesConfigProps) {
  const { config: rawConfig, updateConfig } = useNodeConfig(nodeId);
  const config = rawConfig as FetchAssetAttributesConfigType;
  const [newAttribute, setNewAttribute] = useState('');

  const attributes: string[] = config.attributes || [];

  const addAttribute = () => {
    if (newAttribute.trim() && !attributes.includes(newAttribute.trim())) {
      updateConfig('attributes', [...attributes, newAttribute.trim()]);
      setNewAttribute('');
    }
  };

  const removeAttribute = (attr: string) => {
    updateConfig('attributes', attributes.filter(a => a !== attr));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="assetType">Tipo de Asset (Opcional)</Label>
        <Input
          id="assetType"
          value={config.assetType || ''}
          onChange={(e) => updateConfig('assetType', e.target.value)}
          placeholder="well, field, equipment"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scope">Scope</Label>
        <Select
          value={config.scope || 'SERVER_SCOPE'}
          onValueChange={(value) => updateConfig('scope', value)}
        >
          <SelectTrigger id="scope">
            <SelectValue placeholder="Seleccionar scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SERVER_SCOPE">Server Scope</SelectItem>
            <SelectItem value="SHARED_SCOPE">Shared Scope</SelectItem>
            <SelectItem value="CLIENT_SCOPE">Client Scope</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newAttribute">Atributos *</Label>
        <div className="flex gap-2">
          <Input
            id="newAttribute"
            value={newAttribute}
            onChange={(e) => setNewAttribute(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAttribute()}
            placeholder="nombre_atributo"
          />
          <Button onClick={addAttribute} size="sm">
            Agregar
          </Button>
        </div>

        {attributes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attributes.map((attr) => (
              <Badge key={attr} variant="secondary" className="gap-1">
                {attr}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeAttribute(attr)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
