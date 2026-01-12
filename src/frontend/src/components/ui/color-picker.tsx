import { useState, useRef, useEffect } from 'react';
import { Check, Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const PRESET_COLORS = [
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Ámbar', value: '#f59e0b' },
  { name: 'Amarillo', value: '#eab308' },
  { name: 'Lima', value: '#84cc16' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cian', value: '#06b6d4' },
  { name: 'Azul Cielo', value: '#0ea5e9' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Púrpura', value: '#a855f7' },
  { name: 'Fucsia', value: '#d946ef' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Gris', value: '#6b7280' },
  { name: 'Pizarra', value: '#64748b' },
  { name: 'Zinc', value: '#71717a' },
  { name: 'Negro', value: '#000000' },
  { name: 'Blanco', value: '#ffffff' },
];

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function ColorSpectrum({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hue, setHue] = useState(0);

  useEffect(() => {
    if (value) {
      const hsv = hexToHsv(value);
      setHue(hsv.h);
    }
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujar gradiente de saturación y brillo
    const width = canvas.width;
    const height = canvas.height;

    // Gradiente horizontal (saturación)
    const satGradient = ctx.createLinearGradient(0, 0, width, 0);
    satGradient.addColorStop(0, '#ffffff');
    satGradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
    ctx.fillStyle = satGradient;
    ctx.fillRect(0, 0, width, height);

    // Gradiente vertical (brillo)
    const brightGradient = ctx.createLinearGradient(0, 0, 0, height);
    brightGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    brightGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = brightGradient;
    ctx.fillRect(0, 0, width, height);
  }, [hue]);

  useEffect(() => {
    const hueCanvas = hueRef.current;
    if (!hueCanvas) return;

    const ctx = hueCanvas.getContext('2d');
    if (!ctx) return;

    const width = hueCanvas.width;
    const height = hueCanvas.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.17, '#ffff00');
    gradient.addColorStop(0.33, '#00ff00');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(0.67, '#0000ff');
    gradient.addColorStop(0.83, '#ff00ff');
    gradient.addColorStop(1, '#ff0000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s = x / canvas.width;
    const v = 1 - y / canvas.height;

    const hex = hsvToHex(hue, s, v);
    onChange(hex);
  };

  const handleHueClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newHue = (y / canvas.height) * 360;

    setHue(newHue);
    const hsv = hexToHsv(value);
    const hex = hsvToHex(newHue, hsv.s, hsv.v);
    onChange(hex);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={200}
            height={150}
            className="cursor-crosshair rounded border"
            onClick={handleCanvasClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseMove={(e) => isDragging && handleCanvasClick(e)}
          />
        </div>
        <div className="relative">
          <canvas
            ref={hueRef}
            width={30}
            height={150}
            className="cursor-pointer rounded border"
            onClick={handleHueClick}
          />
        </div>
      </div>
    </div>
  );
}

export function ColorPicker({ value, onChange, placeholder = 'Selecciona un color' }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || '#3b82f6');

  useEffect(() => {
    if (value) {
      setCustomColor(value);
    }
  }, [value]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded border-2 border-gray-300"
                style={{ backgroundColor: value }}
              />
              <span className="font-mono text-sm">{value.toUpperCase()}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="presets">Predefinidos</TabsTrigger>
            <TabsTrigger value="custom">
              <Pipette className="h-4 w-4 mr-2" />
              Personalizado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="p-4 space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Colores predefinidos</label>
              <div className="grid grid-cols-7 gap-2">
                {PRESET_COLORS.map((color) => {
                  const isSelected = value?.toLowerCase() === color.value.toLowerCase();
                  return (
                    <button
                      key={color.value}
                      onClick={() => handleColorSelect(color.value)}
                      className={cn(
                        'relative h-10 w-10 rounded-md border-2 transition-all hover:scale-110',
                        isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-300'
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-lg" style={{
                          filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Código de color</label>
              <Input
                type="text"
                value={customColor}
                onChange={handleCustomColorChange}
                placeholder="#3b82f6"
                className="font-mono"
              />
            </div>
          </TabsContent>

          <TabsContent value="custom" className="p-4 space-y-3">
            <ColorSpectrum value={customColor} onChange={handleColorSelect} />
            
            <div>
              <label className="text-sm font-medium mb-2 block">Color seleccionado</label>
              <div className="flex gap-2 items-center">
                <div
                  className="h-12 w-12 rounded-md border-2 border-gray-300"
                  style={{ backgroundColor: customColor }}
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  placeholder="#3b82f6"
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Haz clic en el espectro para seleccionar cualquier color
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
