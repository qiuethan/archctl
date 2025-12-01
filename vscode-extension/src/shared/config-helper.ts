/**
 * Shared layer - Configuration utilities
 */

import * as vscode from 'vscode';

export class ConfigHelper {
  /**
   * Get the auto-run on save setting
   */
  getAutoRunOnSave(): boolean {
    const config = vscode.workspace.getConfiguration('archctl');
    return config.get<boolean>('autoRunOnSave', true);
  }

  /**
   * Get the debounce delay setting
   */
  getDebounceDelay(): number {
    const config = vscode.workspace.getConfiguration('archctl');
    return config.get<number>('debounceDelay', 1000);
  }
}
