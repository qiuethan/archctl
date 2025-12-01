# Archctl

<p align="center">
  <img src="assets/logo.png" alt="Archctl Logo" width="400"/>
</p>

<p align="center">
  <strong>Architecture Control for Modern Codebases</strong>
</p>

<p align="center">
  Enforce clean architecture patterns, dependency rules, and design principles in your codebase with powerful linting and real-time feedback.
</p>

---

## What is Archctl?

Archctl is a CLI tool and VS Code extension that helps teams maintain clean architecture by enforcing dependency rules, layer boundaries, and architectural patterns. Think of it as ESLint for your architecture.

### Key Features

- **Enforce Layer Boundaries** - Prevent unwanted dependencies between architectural layers
- **Dependency Rules** - Control which modules can import from which layers
- **Cyclic Dependency Detection** - Find and eliminate circular dependencies
- **Interactive HTML Reports** - Beautiful visualizations with health scores and dependency graphs
- **Template-Based Setup** - Start quickly with Clean Architecture, Hexagonal, or custom templates
- **Multi-Language Support** - Works with TypeScript, JavaScript, Python, Java, and more
- **VS Code Integration** - Real-time feedback with inline diagnostics
- **CI/CD Ready** - Fail builds on architecture violations

---

## Quick Start

### Installation

```bash
npm install -g archctl
```

### Initialize Your Project

```bash
cd your-project
archctl init
```

Select a template (Clean Architecture, Hexagonal, or custom) and Archctl will create a `.archctl/archctl.config.json` file.

### Run Architecture Checks

```bash
archctl lint
```

### Visualize Dependencies

```bash
archctl graph
```

---

## Commands

### `archctl init`

Initialize a new Archctl configuration for your project.

```bash
archctl init [options]

Options:
  --force    Overwrite existing configuration
```

### `archctl lint`

Check your codebase for architecture violations.

```bash
archctl lint [options]

Options:
  --format <type>    Output format: text (default), json, or html
  --output <file>    Output file path (for html format)
```

**HTML Report:**
Generate an interactive HTML report with visualizations:

```bash
archctl lint --format html
archctl lint --format html --output report.html
```

The HTML report includes:
- Architecture health score
- Interactive dependency graphs
- Layer interaction matrices
- Violation details with suggestions
- Top dependencies and most imported files

### `archctl graph`

Visualize your project's dependency graph.

```bash
archctl graph [options]

Options:
  --output <file>    Save graph to file
```

### `archctl layers`

Manage architectural layers.

```bash
archctl layers <command>

Commands:
  list               List all defined layers
  add <name>         Add a new layer
  map <pattern>      Map file patterns to layers
```

### `archctl rules`

Manage architecture rules.

```bash
archctl rules <command>

Commands:
  list               List all active rules
  add                Add a new rule interactively
  remove <id>        Remove a rule by ID
```

---

## Architecture Templates

Archctl comes with built-in templates for common architectural patterns:

### Clean Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (Controllers, Views, DTOs)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Application Layer            │
│    (Use Cases, Services)            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Domain Layer               │
│  (Entities, Value Objects, Rules)   │
└─────────────────────────────────────┘
               ▲
┌──────────────┴──────────────────────┐
│      Infrastructure Layer           │
│   (Database, APIs, File System)     │
└─────────────────────────────────────┘
```

**Rules:**
- Domain layer has no dependencies (pure business logic)
- Application layer depends only on Domain
- Infrastructure implements Domain interfaces
- Presentation depends on Application

### Hexagonal Architecture

Ports and Adapters pattern with clear separation between core logic and external concerns.

---

## Configuration

The `.archctl/archctl.config.json` file defines your architecture:

```json
{
  "name": "my-project",
  "layers": [
    {
      "name": "domain",
      "description": "Core business logic"
    },
    {
      "name": "application",
      "description": "Use cases and orchestration"
    },
    {
      "name": "infrastructure",
      "description": "External integrations"
    },
    {
      "name": "presentation",
      "description": "UI and API controllers"
    }
  ],
  "layerMappings": [
    {
      "layer": "domain",
      "include": ["src/domain/**"],
      "priority": 10
    }
  ],
  "rules": [
    {
      "kind": "allowed-layer-import",
      "id": "domain-isolation",
      "title": "Domain Layer Isolation",
      "description": "Domain can only reference other domain code",
      "fromLayer": "domain",
      "allowedLayers": ["domain"]
    },
    {
      "kind": "max-dependencies",
      "id": "max-deps-global",
      "title": "Limit File Dependencies",
      "description": "Files should not have too many dependencies",
      "maxDependencies": 15
    },
    {
      "kind": "cyclic-dependency",
      "id": "no-cycles",
      "title": "No Circular Dependencies",
      "description": "Prevent circular dependencies"
    }
  ]
}
```

---

## Available Rules

### Dependency Rules

- **`allowed-layer-import`** - Whitelist which layers a layer can import from
- **`forbidden-layer-import`** - Blacklist specific layer-to-layer imports
- **`max-dependencies`** - Limit the number of dependencies per file
- **`cyclic-dependency`** - Detect circular dependencies
- **`external-dependency`** - Control which external packages can be used

### Location Rules

- **`file-pattern-layer`** - Enforce that files matching a pattern belong to a specific layer

---

## VS Code Extension

Install the Archctl VS Code extension for real-time architecture feedback:

1. Open VS Code
2. Search for "Archctl" in the Extensions marketplace
3. Install and reload

The extension will automatically:
- Run checks when you save files
- Show violations as inline diagnostics
- Provide quick fixes and suggestions

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/qiuethan/archctl.git
cd archctl

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Acknowledgments

Archctl is inspired by:
- Clean Architecture by Robert C. Martin
- Hexagonal Architecture by Alistair Cockburn
- Domain-Driven Design by Eric Evans
- ArchUnit (Java architecture testing)

---

## Resources

- [Documentation](https://github.com/qiuethan/archctl/wiki)
- [Examples](https://github.com/qiuethan/archctl/tree/main/examples)
- [Issue Tracker](https://github.com/qiuethan/archctl/issues)
- [Discussions](https://github.com/qiuethan/archctl/discussions)

---

<p align="center">
  Made with love by the Archctl team
</p>
