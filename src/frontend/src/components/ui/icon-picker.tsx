import { useState, useMemo } from 'react';
import { Check, Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Obtener todos los iconos de Lucide
const getAllIcons = () => {
  const icons: string[] = [];
  for (const key in LucideIcons) {
    if (key !== 'createLucideIcon' && key !== 'default' && typeof (LucideIcons as any)[key] === 'function') {
      icons.push(key);
    }
  }
  return icons.sort();
};

// Categorías de iconos más comunes
const ICON_CATEGORIES = {
  'comunes': [
    'Activity', 'AlertCircle', 'AlertTriangle', 'Archive', 'Bell', 'Box', 'Calendar',
    'Check', 'Circle', 'Clock', 'Cloud', 'Database', 'Droplet', 'Factory', 'File',
    'Folder', 'Gauge', 'Globe', 'Heart', 'Home', 'Info', 'Layers', 'Lock', 'Mail',
    'Map', 'Package', 'Search', 'Server', 'Settings', 'Star', 'Tag', 'User', 'Users',
  ],
  'flechas': [
    'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowUpDown', 'ArrowUpRight',
    'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronsDown', 'ChevronsLeft',
    'ChevronsRight', 'ChevronsUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'MoveUp',
  ],
  'industria': [
    'Factory', 'Hammer', 'Wrench', 'Tool', 'Cpu', 'HardDrive', 'Server', 'Database',
    'Gauge', 'Activity', 'BarChart', 'TrendingUp', 'Zap', 'Battery', 'Thermometer',
    'Droplet', 'Wind', 'Flame', 'TestTube', 'Microscope',
  ],
  'archivos': [
    'File', 'FileText', 'FileCode', 'FileJson', 'FileSpreadsheet', 'FileImage',
    'FileVideo', 'FileAudio', 'Folder', 'FolderOpen', 'Archive', 'Package',
  ],
  'comunicacion': [
    'Mail', 'MessageSquare', 'MessageCircle', 'Phone', 'PhoneCall', 'Video',
    'Wifi', 'Radio', 'Antenna', 'Bluetooth', 'Cast', 'Share',
  ],
};

export function IconPicker({ value, onChange, placeholder = 'Selecciona un icono' }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('comunes');

  const allIcons = useMemo(() => getAllIcons(), []);

  const filteredIcons = useMemo(() => {
    if (!search) {
      if (activeTab === 'todos') return allIcons;
      return ICON_CATEGORIES[activeTab as keyof typeof ICON_CATEGORIES] || [];
    }
    return allIcons.filter((icon) =>
      icon.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, activeTab, allIcons]);

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Circle;
  };

  const SelectedIcon = value ? getIcon(value) : null;

  const handleClear = () => {
    onChange('');
    setOpen(false);
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
              {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
              <span className="truncate">{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {value && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar entre 800+ iconos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {!search && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="comunes" className="text-xs">Comunes</TabsTrigger>
                <TabsTrigger value="flechas" className="text-xs">Flechas</TabsTrigger>
                <TabsTrigger value="industria" className="text-xs">Industria</TabsTrigger>
                <TabsTrigger value="archivos" className="text-xs">Archivos</TabsTrigger>
                <TabsTrigger value="comunicacion" className="text-xs">Comunic.</TabsTrigger>
                <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto p-3">
          <div className="grid grid-cols-8 gap-1">
            {filteredIcons.map((iconName) => {
              const IconComponent = getIcon(iconName);
              const isSelected = value === iconName;
              return (
                <button
                  key={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-md border hover:bg-accent hover:text-accent-foreground transition-colors',
                    isSelected && 'bg-accent border-primary ring-2 ring-primary'
                  )}
                  title={iconName}
                >
                  <IconComponent className="h-5 w-5" />
                  {isSelected && (
                    <Check className="absolute -right-1 -top-1 h-3 w-3 text-primary bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron iconos con "{search}"
            </div>
          )}
          {!search && filteredIcons.length > 0 && (
            <div className="mt-3 text-xs text-center text-muted-foreground">
              {filteredIcons.length} iconos en esta categoría
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
