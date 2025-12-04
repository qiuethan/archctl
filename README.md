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

- **Enforce Layer Boundaries** - Prevent unwanted dependencies between architectural layers (horizontal architecture)
- **Vertical Context Boundaries** - Enforce modular boundaries between feature contexts with public API contracts
- **Capability-Based Rules** - Control what actions code can perform (network, I/O, database, etc.)
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

Select from available templates:
- **Clean Architecture** - Traditional layered architecture with domain at the core
- **DDD Microservices** - Domain-Driven Design with bounded contexts and aggregates
- **Modular Monolith** - Vertical slice architecture with independent feature modules
- **Custom** - Define your own architecture from scratch

Archctl will create a `.archctl/archctl.config.json` file with your chosen architecture.

### Run Architecture Checks

```bash
archctl lint
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

### `archctl layers`

Manage architectural layers.

```bash
archctl layers <command>

Commands:
  list               List all defined layers
  add <name>         Add a new layer
  map <pattern>      Map file patterns to layers
```

### `archctl contexts`

Manage vertical contexts (context mappings and visibility rules).

```bash
archctl contexts <command>

Commands:
  list                                  List context mappings and visibility rules
  add --context <name> --include <glob> Add or update a context mapping (supports --public, --exclude, --priority)
  remove --context <name>               Remove a context mapping or specific include/public path
  visibility --context <name> --allow   Set which contexts the given context can depend on
```

Examples:
- `archctl contexts add --context billing --include src/billing/** --public src/billing/api/**`
- `archctl contexts visibility --context billing --allow billing,shared`

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

Traditional layered architecture with the domain at the core.

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

### DDD Microservices

Domain-Driven Design applied to microservices with strict bounded contexts, aggregates, and event-driven patterns.

**Layers:**
- **Domain** - Aggregates, entities, value objects, domain events, and domain services
- **Application** - Command/query handlers, use case orchestration
- **Infrastructure** - Repositories, event publishers, message brokers, external adapters
- **API** - REST endpoints, GraphQL resolvers, anti-corruption layers

**Key Rules:**
- Domain model purity (no infrastructure dependencies)
- Aggregate complexity limits
- Bounded context integrity
- No circular dependencies between aggregates

### Modular Monolith

Vertical slice architecture with independent feature modules and explicit contracts. Provides microservice-like modularity within a single deployable unit.

**Layers:**
- **Features** - Self-contained modules with their own domain, logic, and data access
- **Shared** - Common utilities, cross-cutting concerns, reusable components
- **API** - Public contracts and routing that coordinates feature modules

**Key Rules:**
- Feature module isolation (communicate via events or contracts)
- Shared kernel purity (no feature dependencies)
- No direct feature-to-feature coupling
- Feature cohesion limits

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
  "contextMappings": [
    {
      "context": "billing",
      "include": ["src/billing/**"],
      "public": ["src/billing/api/**"]
    },
    {
      "context": "orders",
      "include": ["src/orders/**"],
      "public": ["src/orders/api/**"]
    },
    {
      "context": "shared",
      "include": ["src/shared/**"],
      "public": ["src/shared/**"]
    }
  ],
  "capabilities": [
    {
      "type": "network",
      "imports": ["axios", "node-fetch", "http"],
      "calls": ["fetch", "axios.get"],
      "description": "HTTP requests and network operations"
    },
    {
      "type": "database",
      "imports": ["pg", "mongodb", "typeorm"],
      "calls": ["query", "find", "save"],
      "description": "Database operations"
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
      "kind": "forbidden-capability",
      "id": "no-io-in-domain",
      "title": "No I/O in Domain Layer",
      "description": "Domain should be pure business logic",
      "forbiddenCapabilities": ["network", "database"],
      "layer": "domain"
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
    },
    {
      "kind": "context-visibility",
      "id": "vertical-boundaries",
      "title": "Vertical Context Boundaries",
      "description": "Enforce modular boundaries between feature contexts",
      "contexts": [
        {
          "context": "billing",
          "canDependOn": ["billing", "shared"]
        },
        {
          "context": "orders",
          "canDependOn": ["orders", "shared"]
        }
      ]
    }
  ]
}
```

---

## Available Rules

### Horizontal Architecture Rules (Layers)

- **`allowed-layer-import`** - Whitelist which layers a layer can import from
- **`forbidden-layer-import`** - Blacklist specific layer-to-layer imports
- **`max-dependencies`** - Limit the number of dependencies per file
- **`cyclic-dependency`** - Detect circular dependencies
- **`external-dependency`** - Control which external packages can be used
- **`file-pattern-layer`** - Enforce that files matching a pattern belong to a specific layer

### Vertical Architecture Rules (Contexts)

- **`context-visibility`** - Enforce modular boundaries between feature contexts

**Context visibility** enables vertical slice architecture by defining bounded contexts with explicit public APIs. This prevents feature modules from accessing each other's internal implementation details.

**Key concepts:**
- **Contexts** - Vertical slices of functionality (e.g., billing, orders, inventory)
- **Public APIs** - Files that can be imported by other contexts (defined via glob patterns)
- **Context Dependencies** - Explicit declarations of which contexts can depend on which

**Example:**
```json
{
  "contextMappings": [
    {
      "context": "billing",
      "include": ["src/billing/**"],
      "public": ["src/billing/api/**"]
    },
    {
      "context": "orders",
      "include": ["src/orders/**"],
      "public": ["src/orders/api/**"]
    }
  ],
  "rules": [
    {
      "kind": "context-visibility",
      "id": "vertical-boundaries",
      "title": "Vertical Context Boundaries",
      "description": "Enforce modular boundaries",
      "contexts": [
        {
          "context": "billing",
          "canDependOn": ["billing", "shared"]
        },
        {
          "context": "orders",
          "canDependOn": ["orders", "shared"]
        }
      ]
    }
  ]
}
```

This configuration:
- ✅ Allows `orders` → `orders/api/OrderService.ts` (same context)
- ✅ Allows `billing` → `orders/api/OrderService.ts` (public API, but would fail `canDependOn` check)
- ❌ Blocks `billing` → `orders/internal/OrderRepository.ts` (not in public API)
- ❌ Blocks `orders` → `billing/api/BillingService.ts` (not in `canDependOn` list)

### Capability Rules

- **`allowed-capability`** - Whitelist which capabilities (actions) code can perform
- **`forbidden-capability`** - Blacklist specific capabilities (network, I/O, database, etc.)

Capabilities let you control what actions code can perform, not just what it imports. Define patterns for detecting capabilities like network calls, file I/O, database access, and more. Perfect for enforcing domain purity and preventing side effects in business logic.

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
