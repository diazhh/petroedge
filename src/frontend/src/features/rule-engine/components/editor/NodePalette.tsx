import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNodeLibraryStore } from '../../stores';
import { NodeCategory } from '../../types';

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  input: 'Entrada',
  filter: 'Filtros',
  enrichment: 'Enriquecimiento',
  transform: 'Transformación',
  action: 'Acciones',
  external: 'Externos',
  flow: 'Flujo',
};

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  input: 'bg-yellow-500',
  filter: 'bg-blue-500',
  enrichment: 'bg-cyan-500',
  transform: 'bg-purple-500',
  action: 'bg-green-500',
  external: 'bg-orange-500',
  flow: 'bg-indigo-500',
};

export function NodePalette() {
  const { nodes, searchTerm, setSearchTerm, getNodesByCategory } = useNodeLibraryStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
    new Set(['filter', 'transform', 'action'])
  );

  const toggleCategory = (category: NodeCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredNodes = searchTerm
    ? nodes.filter(
        (node) =>
          node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : nodes;

  const categories: NodeCategory[] = ['input', 'filter', 'enrichment', 'transform', 'action', 'external', 'flow'];

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-2">Paleta de Nodos</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nodos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Node List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {searchTerm ? (
            // Search results
            <div className="space-y-1">
              {filteredNodes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No se encontraron nodos
                </p>
              ) : (
                filteredNodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    className="p-2 rounded border bg-card hover:bg-accent cursor-move transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${CATEGORY_COLORS[node.category]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{node.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Categorized view
            <div className="space-y-2">
              {categories.map((category) => {
                const categoryNodes = getNodesByCategory(category);
                const isExpanded = expandedCategories.has(category);

                return (
                  <div key={category} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <div className={`w-3 h-3 rounded ${CATEGORY_COLORS[category]}`} />
                      <span className="text-sm font-medium flex-1 text-left">
                        {CATEGORY_LABELS[category]}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {categoryNodes.length}
                      </Badge>
                    </button>

                    {isExpanded && (
                      <div className="ml-6 space-y-1">
                        {categoryNodes.map((node) => (
                          <div
                            key={node.type}
                            draggable
                            onDragStart={(e) => onDragStart(e, node.type)}
                            className="p-2 rounded border bg-card hover:bg-accent cursor-move transition-colors"
                          >
                            <p className="text-sm font-medium truncate">{node.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {node.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          Arrastra los nodos al canvas para agregarlos
        </p>
      </div>
    </div>
  );
}
