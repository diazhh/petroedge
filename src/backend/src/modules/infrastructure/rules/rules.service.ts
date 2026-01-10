import { rulesRepository } from './rules.repository.js';
import { ruleEngineService } from './rule-engine.service.js';
import type { CreateRuleInput, UpdateRuleInput } from './rules.schema.js';

export class RulesService {
  async createRule(tenantId: string, userId: string, data: CreateRuleInput) {
    return await rulesRepository.create(tenantId, { ...data, createdBy: userId });
  }

  async getRule(tenantId: string, ruleId: string) {
    const rule = await rulesRepository.findById(tenantId, ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }
    return rule;
  }

  async listRules(tenantId: string, filters?: any) {
    return await rulesRepository.findAll(tenantId, filters);
  }

  async updateRule(tenantId: string, ruleId: string, data: UpdateRuleInput) {
    const rule = await rulesRepository.update(tenantId, ruleId, data);
    if (!rule) {
      throw new Error('Rule not found');
    }
    return rule;
  }

  async deleteRule(tenantId: string, ruleId: string) {
    const deleted = await rulesRepository.delete(tenantId, ruleId);
    if (!deleted) {
      throw new Error('Rule not found');
    }
    return { success: true };
  }

  async activateRule(tenantId: string, ruleId: string) {
    const rule = await rulesRepository.activate(tenantId, ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }
    return rule;
  }

  async deactivateRule(tenantId: string, ruleId: string) {
    const rule = await rulesRepository.deactivate(tenantId, ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }
    return rule;
  }

  async executeRule(tenantId: string, ruleId: string, assetId: string, triggerType: string, triggerData?: any) {
    return await ruleEngineService.executeRule(ruleId, assetId, tenantId, triggerType, triggerData || {});
  }

  async getExecutions(tenantId: string, ruleId: string, filters?: any) {
    return await rulesRepository.getExecutions(tenantId, ruleId, filters);
  }

  async getExecutionStats(tenantId: string, ruleId: string) {
    const stats = await rulesRepository.getExecutionStats(tenantId, ruleId);
    if (!stats) {
      throw new Error('Rule not found');
    }
    return stats;
  }
}

export const rulesService = new RulesService();
