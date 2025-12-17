import * as path from 'path';
import * as fs from 'fs';
import { suggestionService } from '../services/suggestion/suggestionService';
import * as suggestPresenter from '../presentation/suggestPresenter';
import { loadConfig } from '../services/configService';
import { colors } from '../utils/colors';
import { constants } from '../utils/constants';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function cmdSuggest(_args: Record<string, unknown>) {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, constants.defaultOutDir, constants.configFileName);

  if (!fs.existsSync(configPath)) {
    console.error(
      colors.error('archctl is not initialized in this directory. Run `archctl init` first.')
    );
    return;
  }

  try {
    const config = loadConfig(configPath);
    if (!config) {
      console.error(colors.error('Failed to load configuration.'));
      return;
    }

    console.log(colors.info('Analyzing project structure... (this may take a moment)'));

    const result = await suggestionService.suggest(projectRoot, config);

    await suggestPresenter.presentAndApply(result, config, configPath);
  } catch (error) {
    console.error(colors.error(`Analysis failed: ${(error as Error).message}`));
    if (process.env.DEBUG) {
      console.error(error);
    }
  }
}
