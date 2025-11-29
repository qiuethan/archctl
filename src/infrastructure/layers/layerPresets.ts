/**
 * Layer preset definitions
 * These are common layer types that can be quickly added to a project
 */

export interface LayerPreset {
  id: string;
  name: string;
  description: string;
}

export const LAYER_PRESETS: LayerPreset[] = [
  {
    id: 'domain',
    name: 'domain',
    description: 'Domain models, aggregates, and business rules',
  },
  {
    id: 'application',
    name: 'application',
    description: 'Application services and use cases',
  },
  {
    id: 'infrastructure',
    name: 'infrastructure',
    description: 'Persistence, messaging, external integrations',
  },
  {
    id: 'api',
    name: 'api',
    description: 'REST/GraphQL API layer',
  },
  {
    id: 'ui',
    name: 'ui',
    description: 'User interface components and views',
  },
  {
    id: 'persistence',
    name: 'persistence',
    description: 'Database access and data persistence',
  },
  {
    id: 'shared',
    name: 'shared',
    description: 'Shared utilities and common code',
  },
];

/**
 * Get a layer preset by ID
 */
export function getLayerPreset(id: string): LayerPreset | undefined {
  return LAYER_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all available layer presets
 */
export function getAllLayerPresets(): LayerPreset[] {
  return LAYER_PRESETS;
}
