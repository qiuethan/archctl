# Contributing to archctl

Thank you for your interest in contributing to archctl! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/yourusername/archctl.git
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

## Development Workflow

### Making Changes

1. Create a new branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes in the `src/` directory

3. Add tests for your changes in the `tests/` directory

4. Ensure all checks pass:
```bash
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
npm test           # Tests
```

5. Format your code:
```bash
npm run format
```

### Testing Your Changes

Run the CLI locally during development:

```bash
npm run dev -- init --out test-output
```

Or build and test the compiled version:

```bash
npm run build
node dist/cli.js init
```

### Commit Guidelines

We follow conventional commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `chore:` - Build process or tooling changes

Example:
```bash
git commit -m "feat: add support for custom rule validators"
```

## Code Style

- Use TypeScript for all source code
- Follow the existing code style (enforced by ESLint and Prettier)
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Testing

- Write unit tests for all new functionality
- Aim for high test coverage (>80%)
- Use descriptive test names
- Test both success and error cases

Example test structure:
```typescript
describe('featureName', () => {
  it('should handle normal case', () => {
    // Test implementation
  });

  it('should handle edge case', () => {
    // Test implementation
  });

  it('should throw error for invalid input', () => {
    // Test implementation
  });
});
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update tests to reflect your changes
3. Ensure all CI checks pass
4. Request review from maintainers
5. Address any feedback
6. Once approved, your PR will be merged

## Project Structure

```
src/
├── cli.ts              # Entry point and command routing
├── commands/           # Command implementations
│   ├── init.ts        # Init command
│   ├── sync.ts        # Sync command (stub)
│   ├── lint.ts        # Lint command (stub)
│   └── prompt.ts      # Prompt command (stub)
├── config/            # Config loading and validation
│   └── loader.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Shared utilities
    ├── args.ts        # CLI argument parsing
    └── fs.ts          # File system helpers
```

## Adding New Commands

To add a new command:

1. Create a new file in `src/commands/your-command.ts`
2. Export a function `cmdYourCommand(args: ParsedArgs): void`
3. Add the command to `src/cli.ts` in the switch statement
4. Add tests in `tests/commands/your-command.test.ts`
5. Update the help text in `src/cli.ts`
6. Update README.md with command documentation

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- Suggestions for improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
