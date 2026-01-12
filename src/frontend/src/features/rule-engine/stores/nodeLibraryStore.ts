import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NodeDefinition, NodeCategory } from '../types';

interface NodeLibraryState {
  nodes: NodeDefinition[];
  searchQuery: string;
  searchTerm: string;
  selectedCategory: NodeCategory | null;
  
  setNodes: (nodes: NodeDefinition[]) => void;
  setSearchQuery: (query: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: NodeCategory | null) => void;
  
  getFilteredNodes: () => NodeDefinition[];
  getNodesByCategory: (category: NodeCategory) => NodeDefinition[];
  getNodeDefinition: (type: string) => NodeDefinition | undefined;
}

export const useNodeLibraryStore = create<NodeLibraryState>()(
  devtools(
    (set, get) => ({
      nodes: [],
      searchQuery: '',
      searchTerm: '',
      selectedCategory: null,

      setNodes: (nodes) => set({ nodes }),
      
      setSearchQuery: (query) => set({ searchQuery: query, searchTerm: query }),
      
      setSearchTerm: (term) => set({ searchTerm: term, searchQuery: term }),
      
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      getFilteredNodes: () => {
        const { nodes, searchQuery, selectedCategory } = get();
        
        let filtered = nodes;

        if (selectedCategory) {
          filtered = filtered.filter((node) => node.category === selectedCategory);
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (node) =>
              node.name.toLowerCase().includes(query) ||
              node.description.toLowerCase().includes(query) ||
              node.type.toLowerCase().includes(query)
          );
        }

        return filtered;
      },

      getNodesByCategory: (category: NodeCategory) => {
        const { nodes } = get();
        return nodes.filter(node => node.category === category);
      },

      getNodeDefinition: (type) => {
        return get().nodes.find((node) => node.type === type);
      },
    }),
    { name: 'NodeLibraryStore' }
  )
);
