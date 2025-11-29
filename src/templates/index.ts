/**
 * Central template library index
 *
 * This module collects all template definitions from the definitions/ folder
 * and exports them as both an array and a lookup map.
 *
 * To add a new template:
 * 1. Create a new file in definitions/ (e.g., myTemplate.ts)
 * 2. Export a TemplateDefinition constant
 * 3. Import and add it to TEMPLATES array below
 */

import type { TemplateDefinition } from '../types/templates';
import { cleanArchitectureTemplate } from './definitions/cleanArchitecture';
import { dddMicroservicesTemplate } from './definitions/dddMicroservices';
import { modularMonolithTemplate } from './definitions/modularMonolith';

/**
 * Array of all available template definitions
 * Add new templates here as they are created
 */
export const TEMPLATES: TemplateDefinition[] = [
  cleanArchitectureTemplate,
  dddMicroservicesTemplate,
  modularMonolithTemplate,
];

/**
 * Map of template ID to template definition for fast lookup
 * Automatically generated from TEMPLATES
 */
export const TEMPLATES_BY_ID: Record<string, TemplateDefinition> = Object.fromEntries(
  TEMPLATES.map((def) => [def.id, def]),
);

/**
 * Get a template definition by ID
 * @param id - The template ID to look up
 * @returns The template definition, or undefined if not found
 */
export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATES_BY_ID[id];
}

