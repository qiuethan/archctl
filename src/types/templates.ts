/**
 * Template system types for reusable architecture configurations
 */

import type { RuleConfig } from './config';

/**
 * Layer definition within a template (conceptual only, no file paths)
 */
export interface TemplateLayer {
  name: string;
  description: string;
}

/**
 * A template definition for a specific architecture style
 */
export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;

  layers: TemplateLayer[];

  /** Concrete rule configurations */
  rules: RuleConfig[];
}
