# Contributing to Archctl

Thank you for your interest in contributing to Archctl! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- TypeScript knowledge
- Familiarity with architectural patterns (Clean Architecture, DDD, etc.)

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/archctl.git
cd archctl
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Run tests**

```bash
npm test
```

5. **Run in development mode**

```bash
npm run dev
```

## Project Structure

```
archctl/
├── src/
│   ├── commands/          # CLI commands (init, lint, graph, etc.)
│   ├── infrastructure/    # Core implementation
│   │   ├── config/        # Configuration management
│   │   ├── graph/         # Dependency graph analysis
│   │   ├── layers/        # Layer mapping logic
│   │   └── rules/         # Rule implementations
│   ├── presentation/      # CLI output formatting
│   ├── services/          # Business logic services
│   ├── templates/         # Architecture templates
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── vscode-extension/      # VS Code extension
└── dist/                  # Compiled output
```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/qiuethan/archctl/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node version, etc.)
   - Sample code or project if possible

### Suggesting Features

1. Check [Discussions](https://github.com/qiuethan/archctl/discussions) for existing suggestions
2. Create a new discussion or issue describing:
   - The problem you're trying to solve
   - Your proposed solution
   - Why this would be useful to others
   - Any alternatives you've considered

### Submitting Pull Requests

1. **Create a branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes**

- Write clean, readable code
- Follow existing code style
- Add tests for new functionality
- Update documentation as needed

3. **Test your changes**

```bash
npm test
npm run lint
npm run build
```

4. **Commit your changes**

Use conventional commit messages:

```bash
git commit -m "feat: add support for Python imports"
git commit -m "fix: resolve cyclic dependency false positives"
git commit -m "docs: update README with new examples"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

5. **Push and create PR**

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Link to related issues
- Screenshots if applicable
- Test results

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for high code coverage
- Test edge cases and error conditions

### Adding New Rules

To add a new architecture rule:

1. **Create rule implementation** in `src/infrastructure/rules/`

```typescript
import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';

export interface YourRuleConfig {
  // Configuration options
}

export class YourRule extends BaseRule {
  constructor(id: string, title: string, description: string, config: YourRuleConfig) {
    super(id, title, description);
    // Initialize config
  }

  check(ctx: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    // Implement rule logic
    return violations;
  }
}
```

2. **Add config type** in `src/types/config.ts`

```typescript
export interface YourRuleConfig {
  kind: 'your-rule-kind';
  id: string;
  title: string;
  description: string;
  // Your specific config fields
}

// Add to RuleConfig union
export type RuleConfig =
  | ExistingRuleConfig
  | YourRuleConfig;
```

3. **Wire up in ruleService** (`src/services/ruleService.ts`)

```typescript
case 'your-rule-kind':
  rule = new YourRule(config.id, config.title, config.description, {
    // Map config
  });
  break;
```

4. **Add tests** in `tests/infrastructure/rules/`

5. **Update documentation**

### Adding New Templates

To add an architecture template:

1. Create template definition in `src/templates/definitions/`
2. Define layers and rules
3. Add to `src/templates/index.ts`
4. Add documentation and examples

## Release Process

Releases are managed by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Questions?

- Open a [Discussion](https://github.com/qiuethan/archctl/discussions)
- Join our community chat (coming soon)
- Email: ethanqiu@gmail.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
