# archctl

> Architecture control CLI - Define, enforce, and propagate architecture rules for your codebase

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

## Overview

`archctl` is a production-quality CLI tool that helps teams define, enforce, and propagate architecture rules across their codebase. It provides a structured way to document architectural decisions, validate code against defined rules, and generate architecture-aware documentation and prompts.

## Features

- 🏗️ **Architecture Definition** - Define layers, dependencies, and rules in a simple JSON config
- 🔍 **Rule Enforcement** - Lint your codebase against architectural constraints
- 📚 **Documentation Generation** - Automatically sync architecture docs across your project
- 🤖 **AI-Ready Prompts** - Generate architecture-aware prompts for AI assistants
- 🎯 **TypeScript-First** - Built with TypeScript for type safety and great DX
- ⚡ **Fast & Lightweight** - Minimal dependencies, fast execution

## Installation

### Global Installation

```bash
npm install -g archctl
```

### Local Development

```bash
npm install --save-dev archctl
```

## Quick Start

### 1. Initialize Architecture Config

```bash
archctl init
```

This creates an `architecture/` folder with a skeleton `architecture.config.json`:

```json
{
  "name": "My Architecture",
  "language": "TypeScript",
  "framework": "Node.js",
  "testing": "Vitest",
  "layers": [],
  "rules": []
}
```

### 2. Define Your Architecture

Edit `architecture/architecture.config.json` to define your layers and rules:

```json
{
  "name": "My API Architecture",
  "language": "TypeScript",
  "framework": "Express",
  "testing": "Vitest",
  "layers": [
    {
      "name": "controllers",
      "path": "src/controllers",
      "description": "HTTP request handlers"
    },
    {
      "name": "services",
      "path": "src/services",
      "description": "Business logic"
    },
    {
      "name": "repositories",
      "path": "src/repositories",
      "description": "Data access layer"
    }
  ],
  "rules": [
    {
      "id": "no-controller-to-repo",
      "type": "dependency",
      "severity": "error",
      "description": "Controllers cannot directly import from repositories"
    }
  ]
}
```

### 3. Lint Your Codebase

```bash
archctl lint
```

### 4. Generate Documentation

```bash
archctl sync
```

### 5. Create AI Prompts

```bash
archctl prompt
```

## Commands

### `archctl init`

Initialize a new architecture configuration.

**Options:**
- `--out <dir>` - Output directory (default: `architecture`)
- `--force` - Overwrite existing config

**Examples:**
```bash
archctl init
archctl init --out .archctl
archctl init --out config/arch --force
```

### `archctl sync`

Propagate architecture documentation across your project.

**Status:** 🚧 Coming soon

### `archctl lint`

Enforce architecture rules and report violations.

**Status:** 🚧 Coming soon

### `archctl prompt`

Generate AI prompts with architecture context.

**Status:** 🚧 Coming soon

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/archctl.git
cd archctl

# Install dependencies
npm install

# Build the project
npm run build
```

### Available Scripts

- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm run dev`** - Run the CLI from source (ts-node)
- **`npm run lint`** - Run ESLint
- **`npm run lint:fix`** - Fix ESLint errors automatically
- **`npm run format`** - Format code with Prettier
- **`npm run format:check`** - Check code formatting
- **`npm test`** - Run tests
- **`npm run test:watch`** - Run tests in watch mode
- **`npm run test:coverage`** - Generate test coverage report
- **`npm run typecheck`** - Run TypeScript type checking

### Project Structure

```
archctl/
├── src/
│   ├── cli.ts              # CLI entry point and command routing
│   ├── commands/           # Command implementations
│   │   ├── init.ts
│   │   ├── sync.ts
│   │   ├── lint.ts
│   │   └── prompt.ts
│   ├── config/             # Config loading and validation
│   │   └── loader.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── utils/              # Shared utilities
│       ├── args.ts
│       └── fs.ts
├── tests/                  # Test files
│   ├── commands/
│   ├── config/
│   └── utils/
├── dist/                   # Compiled output (gitignored)
├── .eslintrc.cjs          # ESLint configuration
├── .prettierrc            # Prettier configuration
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Vitest configuration
└── package.json
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Vitest** for testing

Before committing, ensure:
```bash
npm run typecheck  # No TypeScript errors
npm run lint       # No linting errors
npm test           # All tests pass
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT © [Your Name]

See [LICENSE](LICENSE) for details.

## Roadmap

- [x] Project scaffolding and CLI foundation
- [x] `init` command for creating architecture configs
- [ ] `lint` command for rule enforcement
- [ ] `sync` command for documentation generation
- [ ] `prompt` command for AI integration
- [ ] Plugin system for custom rules
- [ ] Integration with popular frameworks
- [ ] VS Code extension

## Support

- 📖 [Documentation](https://github.com/yourusername/archctl#readme)
- 🐛 [Issue Tracker](https://github.com/yourusername/archctl/issues)
- 💬 [Discussions](https://github.com/yourusername/archctl/discussions)

---

Built with ❤️ using TypeScript and Node.js
