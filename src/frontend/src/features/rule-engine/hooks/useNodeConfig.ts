import { useState, useCallback } from 'react';
import { useRuleEditorStore } from '../stores';

export function useNodeConfig(nodeId: string) {
  const { nodes, updateNode } = useRuleEditorStore();
  const node = nodes.find(n => n.id === nodeId);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConfig = useCallback((key: string, value: any) => {
    if (!node) return;
    const currentConfig = (node.data?.config as Record<string, any>) || {};
    const newConfig = { ...currentConfig, [key]: value };
    updateNode(nodeId, { config: newConfig });

    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [node, nodeId, updateNode, errors]);

  const updateMultipleConfig = useCallback((updates: Record<string, any>) => {
    if (!node) return;
    const currentConfig = (node.data?.config as Record<string, any>) || {};
    const newConfig = { ...currentConfig, ...updates };
    updateNode(nodeId, { config: newConfig });
  }, [node, nodeId, updateNode]);

  const validateField = useCallback((key: string, value: any, rules: any) => {
    if (rules.required && !value) {
      setErrors(prev => ({ ...prev, [key]: 'Este campo es requerido' }));
      return false;
    }

    if (rules.min !== undefined && value < rules.min) {
      setErrors(prev => ({ ...prev, [key]: `Valor mínimo: ${rules.min}` }));
      return false;
    }

    if (rules.max !== undefined && value > rules.max) {
      setErrors(prev => ({ ...prev, [key]: `Valor máximo: ${rules.max}` }));
      return false;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      setErrors(prev => ({ ...prev, [key]: rules.message || 'Formato inválido' }));
      return false;
    }

    return true;
  }, []);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    config: node?.data.config || {},
    updateConfig,
    updateMultipleConfig,
    validateField,
    errors,
    resetErrors,
  };
}
