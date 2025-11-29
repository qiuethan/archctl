/**
 * Central rule library index
 *
 * This module collects all rule definitions from the definitions/ folder
 * and exports them as both an array and a lookup map.
 *
 * To add a new rule:
 * 1. Create a new file in definitions/ (e.g., myNewRule.ts)
 * 2. Export a RuleDefinition constant
 * 3. Import and add it to RULE_DEFINITIONS array below
 */

import type { RuleDefinition } from '../types/rules';
import { aggregateRootOnlyMutationRule } from './definitions/aggregateRootOnlyMutation';
import { domainEventsUsageRule } from './definitions/domainEventsUsage';
import { domainModelsImmutableRule } from './definitions/domainModelsImmutable';
import { domainNoUIAwarenessRule } from './definitions/domainNoUIAwareness';
import { limitPublicAPIExposureRule } from './definitions/limitPublicAPIExposure';
import { noBusinessLogicInControllersRule } from './definitions/noBusinessLogicInControllers';
import { noBusinessLogicInRepositoriesRule } from './definitions/noBusinessLogicInRepositories';
import { noCyclicDependenciesRule } from './definitions/noCyclicDependencies';
import { noDomainExposureViaDTOsRule } from './definitions/noDomainExposureViaDTOs';
import { noFeatureCrossTalkRule } from './definitions/noFeatureCrossTalk';
import { noInfrastructureToDomainRule } from './definitions/noInfrastructureToDomain';
import { noSharedStateBetweenMicroservicesRule } from './definitions/noSharedStateBetweenMicroservices';
import { persistenceOnlyCRUDRule } from './definitions/persistenceOnlyCRUD';

/**
 * Array of all available rule definitions
 * Add new rules here as they are created
 */
export const RULE_DEFINITIONS: RuleDefinition[] = [
  aggregateRootOnlyMutationRule,
  domainEventsUsageRule,
  domainModelsImmutableRule,
  domainNoUIAwarenessRule,
  limitPublicAPIExposureRule,
  noBusinessLogicInControllersRule,
  noBusinessLogicInRepositoriesRule,
  noCyclicDependenciesRule,
  noDomainExposureViaDTOsRule,
  noFeatureCrossTalkRule,
  noInfrastructureToDomainRule,
  noSharedStateBetweenMicroservicesRule,
  persistenceOnlyCRUDRule,
];

/**
 * Map of rule ID to rule definition for fast lookup
 * Automatically generated from RULE_DEFINITIONS
 */
export const RULES_BY_ID: Record<string, RuleDefinition> = Object.fromEntries(
  RULE_DEFINITIONS.map((def) => [def.id, def]),
);

/**
 * Get a rule definition by ID
 * @param id - The rule ID to look up
 * @returns The rule definition, or undefined if not found
 */
export function getRuleById(id: string): RuleDefinition | undefined {
  return RULES_BY_ID[id];
}

/**
 * Get all rules matching specific tags
 * @param tags - Tags to filter by (OR logic - matches any tag)
 * @returns Array of matching rule definitions
 */
export function getRulesByTags(tags: string[]): RuleDefinition[] {
  const tagSet = new Set(tags);
  return RULE_DEFINITIONS.filter((rule) =>
    rule.tags?.some((tag) => tagSet.has(tag)),
  );
}

/**
 * Get all rules of a specific kind
 * @param kind - The rule kind to filter by
 * @returns Array of matching rule definitions
 */
export function getRulesByKind(kind: RuleDefinition['kind']): RuleDefinition[] {
  return RULE_DEFINITIONS.filter((rule) => rule.kind === kind);
}
