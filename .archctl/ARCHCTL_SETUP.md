# Archctl Configuration Syntax

Quick reference for `archctl.config.json` syntax.

## Basic Structure

```json
{
  "name": string,
  "entryPoint": string?,
  "exclude": string[]?,
  "layers": LayerConfig[],
  "layerMappings": LayerMapping[]?,
  "contextMappings": ContextMapping[]?,
  "capabilities": CapabilityPattern[]?,
  "rules": RuleConfig[]
}
```

## Types

### LayerConfig
```json
{
  "name": string,
  "description": string
}
```

### LayerMapping
```json
{
  "layer": string,
  "include": string[],
  "exclude": string[]?,
  "priority": number?
}
```

### ContextMapping
```json
{
  "context": string,
  "include": string[],
  "exclude": string[]?,
  "public": string[]?,
  "priority": number?
}
```
Use contexts to separate vertical slices (e.g., billing, orders, shared). `public` defines the API surface other contexts can import, and `priority` resolves overlapping mappings.

### CapabilityPattern
```json
{
  "type": string,
  "imports": string[]?,
  "calls": string[]?,
  "description": string
}
```

Capabilities define what actions code can perform (e.g., network calls, file I/O, database access). You define patterns that detect when code uses these capabilities, then create rules to enforce architectural constraints.

**Example:**
```json
{
  "type": "filesystem",
  "imports": ["fs", "fs/promises"],
  "calls": ["readFile", "writeFile", "existsSync"],
  "description": "File system operations"
}
```

### RuleConfig (union type)

All rules share these base properties:
```json
{
  "kind": string,
  "id": string,
  "title": string,
  "description": string
}
```

#### `allowed-layer-import`
```json
{
  "kind": "allowed-layer-import",
  "id": string,
  "title": string,
  "description": string,
  "fromLayer": string,
  "allowedLayers": string[]
}
```

#### `forbidden-layer-import`
```json
{
  "kind": "forbidden-layer-import",
  "id": string,
  "title": string,
  "description": string,
  "fromLayer": string,
  "toLayer": string
}
```

#### `max-dependencies`
```json
{
  "kind": "max-dependencies",
  "id": string,
  "title": string,
  "description": string,
  "maxDependencies": number,
  "layer": string?
}
```

#### `cyclic-dependency`
```json
{
  "kind": "cyclic-dependency",
  "id": string,
  "title": string,
  "description": string
}
```

#### `external-dependency`
```json
{
  "kind": "external-dependency",
  "id": string,
  "title": string,
  "description": string,
  "allowedPackages": string[],
  "layer": string?
}
```

#### `context-visibility`
```json
{
  "kind": "context-visibility",
  "id": string,
  "title": string,
  "description": string,
  "contexts": [
    {
      "context": string,
      "canDependOn": string[]
    }
  ]
}
```

Defines which contexts can depend on which. Imports across contexts also need the target file to match that context's `public` patterns in `contextMappings`.

#### `file-pattern-layer`
```json
{
  "kind": "file-pattern-layer",
  "id": string,
  "title": string,
  "description": string,
  "pattern": string,
  "requiredLayer": string
}
```

#### `natural-language`
```json
{
  "kind": "natural-language",
  "id": string,
  "title": string,
  "description": string,
  "prompt": string,
  "severity": "info" | "warning" | "error"?
}
```

#### `allowed-capability`
```json
{
  "kind": "allowed-capability",
  "id": string,
  "title": string,
  "description": string,
  "allowedCapabilities": string[],
  "layer": string?
}
```

Whitelist approach - only specified capabilities are allowed in the layer.

#### `forbidden-capability`
```json
{
  "kind": "forbidden-capability",
  "id": string,
  "title": string,
  "description": string,
  "forbiddenCapabilities": string[],
  "layer": string?
}
```

Blacklist approach - specified capabilities are forbidden in the layer.

## Contexts (Vertical Architecture)

Combine `contextMappings` with the `context-visibility` rule to separate feature slices (billing, orders, shared). `contextMappings` assigns files to contexts and defines their `public` API globs; `context-visibility` declares which contexts may depend on each other.

## Complete Example

```json
{
  "name": "my-app",
  "entryPoint": "src/index.ts",
  "exclude": ["node_modules", "dist", "build", "tests", "coverage"],
  "layers": [
    {
      "name": "domain",
      "description": "Core business logic and entities"
    },
    {
      "name": "application",
      "description": "Use cases and application services"
    },
    {
      "name": "infrastructure",
      "description": "Database, APIs, and external services"
    },
    {
      "name": "presentation",
      "description": "Controllers and API endpoints"
    }
  ],
  "layerMappings": [
    {
      "layer": "domain",
      "include": ["src/domain/**"],
      "priority": 10
    },
    {
      "layer": "application",
      "include": ["src/application/**", "src/services/**"],
      "priority": 5
    },
    {
      "layer": "infrastructure",
      "include": ["src/infrastructure/**", "src/repositories/**"],
      "priority": 5
    },
    {
      "layer": "presentation",
      "include": ["src/controllers/**", "src/api/**"],
      "priority": 5
    }
  ],
  "contextMappings": [
    {
      "context": "billing",
      "include": ["src/billing/**"],
      "public": ["src/billing/api/**"],
      "priority": 5
    },
    {
      "context": "orders",
      "include": ["src/orders/**"],
      "public": ["src/orders/api/**"],
      "priority": 5
    },
    {
      "context": "shared",
      "include": ["src/shared/**"],
      "public": ["src/shared/**"],
      "priority": 1
    }
  ],
  "capabilities": [
    {
      "type": "network",
      "imports": ["axios", "node-fetch", "http", "https"],
      "calls": ["fetch", "axios.get", "axios.post"],
      "description": "HTTP requests and network operations"
    },
    {
      "type": "filesystem",
      "imports": ["fs", "fs/promises"],
      "calls": ["readFile", "writeFile", "existsSync"],
      "description": "File system operations"
    },
    {
      "type": "database",
      "imports": ["pg", "mongodb", "typeorm"],
      "calls": ["query", "find", "save"],
      "description": "Database access"
    }
  ],
  "rules": [
    {
      "kind": "allowed-layer-import",
      "id": "domain-isolation",
      "title": "Domain Layer Isolation",
      "description": "Domain can only reference domain",
      "fromLayer": "domain",
      "allowedLayers": ["domain"]
    },
    {
      "kind": "allowed-layer-import",
      "id": "application-dependencies",
      "title": "Application Dependencies",
      "description": "Application depends on domain",
      "fromLayer": "application",
      "allowedLayers": ["domain", "application"]
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
        },
        {
          "context": "shared",
          "canDependOn": ["shared"]
        }
      ]
    },
    {
      "kind": "max-dependencies",
      "id": "max-deps-global",
      "title": "Global Dependency Limit",
      "description": "Files should not exceed 15 dependencies",
      "maxDependencies": 15
    },
    {
      "kind": "cyclic-dependency",
      "id": "no-cycles",
      "title": "No Circular Dependencies",
      "description": "Prevent circular dependencies"
    },
    {
      "kind": "forbidden-capability",
      "id": "no-network-in-domain",
      "title": "No Network Calls in Domain",
      "description": "Domain should be pure business logic",
      "forbiddenCapabilities": ["network", "filesystem"],
      "layer": "domain"
    },
    {
      "kind": "allowed-capability",
      "id": "infrastructure-capabilities",
      "title": "Infrastructure Allowed Capabilities",
      "description": "Infrastructure can perform I/O and external calls",
      "allowedCapabilities": ["network", "filesystem", "database"],
      "layer": "infrastructure"
    }
  ]
}
```

## Resources

- [Archctl Documentation](https://github.com/qiuethan/archctl/wiki)
- [Examples](https://github.com/qiuethan/archctl/tree/main/examples)
