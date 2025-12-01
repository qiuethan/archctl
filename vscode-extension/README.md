# Archctl - Architecture Linter for VS Code

<p align="center">
  <strong>Enforce clean architecture patterns and dependency rules with real-time feedback</strong>
</p>

---

## Overview

The Archctl VS Code extension brings powerful architecture linting directly into your editor. Get instant feedback on architecture violations as you code, helping you maintain clean architecture patterns and enforce dependency rules across your codebase.

This extension integrates seamlessly with the [Archctl CLI tool](https://github.com/qiuethan/archctl) to provide real-time diagnostics for:

- **Layer Boundary Violations** - Catch unwanted dependencies between architectural layers
- **Dependency Rule Violations** - Enforce which modules can import from which layers
- **Circular Dependencies** - Detect and eliminate cyclic dependencies
- **Architecture Pattern Enforcement** - Maintain Clean Architecture, Hexagonal, or custom patterns

---

## Getting Started

### Prerequisites

1. **Install Archctl CLI**:
   ```bash
   npm install -g archctl
   ```

2. **Initialize your project**:
   ```bash
   cd your-project
   archctl init
   ```
   
   This creates a `.archctl/archctl.config.json` file that defines your architecture rules.

### Install the Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Archctl"
4. Click Install

---

## Features

### Real-Time Architecture Validation

The extension automatically runs architecture checks and displays violations as inline diagnostics:

- **Error Squiggles**: Architecture violations appear directly in your code
- **Problems Panel**: View all violations in the Problems panel
- **Hover Information**: See detailed violation messages and suggestions
- **Auto-Run on Save**: Checks run automatically when you save files (configurable)

### Commands

Access these commands via the Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- **`Archctl: Run Architecture Check`** - Manually trigger an architecture check
- **`Archctl: Clear Diagnostics`** - Clear all architecture diagnostics

### Smart Diagnostics

Each violation includes:
- **Rule ID**: The specific rule that was violated
- **Severity**: Error, Warning, or Info
- **Message**: Clear description of the violation
- **Suggestion**: Helpful hints on how to fix the issue (when available)
- **Location**: Precise line and column information

---

## Configuration

Configure the extension via VS Code settings:

### `archctl.autoRunOnSave`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Automatically run architecture checks when files are saved

### `archctl.debounceDelay`
- **Type**: `number`
- **Default**: `1000` (milliseconds)
- **Description**: Delay before running checks after file changes

### Example Settings

```json
{
  "archctl.autoRunOnSave": true,
  "archctl.debounceDelay": 1500
}
```

---

## Supported File Types

The extension monitors changes to:
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`, `.mjs`, `.cjs`)
- Python (`.py`)
- Java (`.java`)

---

## How It Works

1. **Activation**: The extension activates when you open a workspace containing `.archctl/archctl.config.json`
2. **File Watching**: Monitors file changes in supported languages
3. **Architecture Check**: Runs `archctl lint --format json` to analyze your code
4. **Diagnostics**: Parses violations and displays them as VS Code diagnostics
5. **Real-Time Updates**: Re-runs checks automatically when files change (with debouncing)

---

## Example Workflow

1. **Define your architecture** in `.archctl/archctl.config.json`:
   ```json
   {
     "layers": [
       { "name": "domain", "description": "Core business logic" },
       { "name": "application", "description": "Use cases" },
       { "name": "infrastructure", "description": "External integrations" }
     ],
     "rules": [
       {
         "kind": "allowed-layer-import",
         "id": "domain-isolation",
         "fromLayer": "domain",
         "allowedLayers": ["domain"]
       }
     ]
   }
   ```

2. **Write code** that violates a rule:
   ```typescript
   // src/domain/user.ts
   import { Database } from '../infrastructure/database'; // Violation!
   ```

3. **See the violation** immediately in your editor:
   - Red squiggle under the import
   - Error in Problems panel: "Layer 'domain' cannot import from 'infrastructure'"
   - Suggestion: "Consider using dependency injection or moving this to the application layer"

4. **Fix the violation** and watch the diagnostic disappear automatically

---

## Troubleshooting

### Extension Not Working?

1. **Check for config file**: Ensure `.archctl/archctl.config.json` exists in your workspace root
2. **Verify Archctl CLI**: Run `archctl lint` in your terminal to confirm the CLI works
3. **Check Output Panel**: View "Archctl" in the Output panel for debug logs
4. **Reload Window**: Try reloading VS Code (Ctrl+Shift+P → "Developer: Reload Window")

### No Diagnostics Appearing?

- Ensure `archctl.autoRunOnSave` is enabled
- Manually trigger a check: Command Palette → "Archctl: Run Architecture Check"
- Check that your files match the configured layer mappings

### Performance Issues?

- Increase `archctl.debounceDelay` to reduce check frequency
- Temporarily disable `archctl.autoRunOnSave` for large refactorings

---

## Contributing

Found a bug or have a feature request? Please open an issue on the [GitHub repository](https://github.com/qiuethan/archctl/issues).

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/qiuethan/archctl.git
   cd archctl/vscode-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Open in VS Code and press F5 to launch the Extension Development Host

4. Make changes and test in the development window

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Links

- **Main Project**: [Archctl on GitHub](https://github.com/qiuethan/archctl)
- **Documentation**: [Archctl Wiki](https://github.com/qiuethan/archctl/wiki)
- **Issue Tracker**: [Report Issues](https://github.com/qiuethan/archctl/issues)
- **VS Code Marketplace**: [Archctl Extension](https://marketplace.visualstudio.com/items?itemName=archctl.archctl-vscode)

---

<p align="center">
  Made for clean architecture
</p>
