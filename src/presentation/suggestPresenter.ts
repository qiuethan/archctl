import chalk from 'chalk';
import { confirm, checkbox, select, input } from '@inquirer/prompts';
import type { SuggestionResult, DirectorySuggestion } from '../types/suggestion';
import type { ArchctlConfig, LayerMapping } from '../types/config';
import * as fs from 'fs';

/**
 * Present suggestions and interactively apply changes
 */
export async function presentAndApply(
  result: SuggestionResult,
  currentConfig: ArchctlConfig,
  configPath: string
): Promise<void> {
  console.log(chalk.bold('\n🔍 Archctl Discovery\n'));
  console.log(chalk.gray(`Analyzed ${result.suggestions.length} directories.\n`));

  let approvedMappings: LayerMapping[] = [];

  if (result.suggestions.length > 0) {
    // Filter out low confidence suggestions
    const highConfidence = result.suggestions.filter((s) => s.confidence > 0.4);

    if (highConfidence.length > 0) {
      // Group by Layer
      const byLayer: Record<string, DirectorySuggestion[]> = {};
      for (const s of highConfidence) {
        if (!byLayer[s.suggestedLayer]) {
          byLayer[s.suggestedLayer] = [];
        }
        byLayer[s.suggestedLayer]!.push(s);
      }

      // Interactive Review
      for (const [layer, suggestions] of Object.entries(byLayer)) {
        console.log(chalk.cyan(`\nFound potential ${chalk.bold(layer.toUpperCase())} components:`));

        const choices = suggestions.map((s) => ({
          name: `${s.path} ${chalk.gray(`(confidence: ${Math.round(s.confidence * 100)}%)`)}`,
          value: s,
          checked: true,
        }));

        const selected = await checkbox({
          message: `Select directories to map to '${layer}' layer:`,
          choices,
        });

        for (const s of selected) {
          approvedMappings.push({
            layer: layer,
            include: [`${s.path}/**`],
          });
        }
      }
    } else {
      console.log(
        chalk.yellow('Found some directories, but confidence is too low to make suggestions.')
      );
    }
  } else {
    console.log(chalk.yellow('No significant architectural patterns found to suggest.'));
  }

  // Ask for manual configuration
  const wantManual = await confirm({
    message: 'Would you like to manually map any layers?',
    default: false,
  });

  if (wantManual) {
    const manualMappings = await presentManualConfiguration(currentConfig);
    approvedMappings = [...approvedMappings, ...manualMappings];
  }

  if (approvedMappings.length === 0) {
    console.log('No changes selected.');
    return;
  }

  // Confirm apply
  console.log(chalk.bold('\nProposed Configuration Changes:'));
  approvedMappings.forEach((m) => {
    console.log(`  ${chalk.green('+')} Map ${chalk.white(m.include[0])} ➜ ${chalk.blue(m.layer)}`);
  });

  const shouldApply = await confirm({
    message: 'Apply these changes to archctl.config.json?',
    default: true,
  });

  if (shouldApply) {
    updateConfig(currentConfig, approvedMappings, configPath);
  }
}

async function presentManualConfiguration(config: ArchctlConfig): Promise<LayerMapping[]> {
  const mappings: LayerMapping[] = [];
  let continueMapping = true;

  const availableLayers = config.layers.map((l) => l.name);
  if (availableLayers.length === 0) {
    console.log(chalk.yellow('No layers defined in config.'));
    return [];
  }

  while (continueMapping) {
    const layer = await select({
      message: 'Select a layer to map:',
      choices: availableLayers.map((l) => ({ name: l, value: l })),
    });

    const pathPattern = await input({
      message: `Enter glob pattern for ${layer} (e.g., src/domain/**):`,
      validate: (input) => (input.length > 0 ? true : 'Path cannot be empty'),
    });

    mappings.push({
      layer,
      include: [pathPattern],
      priority: 1, // Ensure manual mappings override suggestions
    });

    continueMapping = await confirm({
      message: 'Map another layer?',
      default: true,
    });
  }

  return mappings;
}

function updateConfig(config: ArchctlConfig, newMappings: LayerMapping[], configPath: string) {
  // Merge mappings
  const existingMappings = config.layerMappings || [];

  // Simple append for now, but ideally checks for duplicates
  const updatedMappings = [...existingMappings, ...newMappings];

  // Also ensure layers exist in config.layers
  const existingLayerNames = new Set(config.layers.map((l) => l.name));
  const newLayersToAdd = new Set<string>();

  newMappings.forEach((m) => {
    if (!existingLayerNames.has(m.layer)) {
      newLayersToAdd.add(m.layer);
    }
  });

  const updatedLayers = [...config.layers];
  newLayersToAdd.forEach((layerName) => {
    updatedLayers.push({
      name: layerName,
      description: `Auto-discovered ${layerName} layer`,
    });
  });

  const newConfig = {
    ...config,
    layers: updatedLayers,
    layerMappings: updatedMappings,
  };

  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  console.log(chalk.green(`\n✅ Configuration updated at ${configPath}`));
}
