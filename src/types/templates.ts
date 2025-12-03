/**
 * Template system types for reusable architecture configurations
 */

import type { RuleConfig } from './config';
import type { CapabilityPattern } from './capabilities';

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

  /** Capability patterns for detecting code actions */
  capabilities?: CapabilityPattern[];

  /** Concrete rule configurations */
  rules: RuleConfig[];
}
