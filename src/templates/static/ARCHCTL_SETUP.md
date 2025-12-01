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
    }
  ]
}
```

## Resources

- [Archctl Documentation](https://github.com/qiuethan/archctl/wiki)
- [Examples](https://github.com/qiuethan/archctl/tree/main/examples)
