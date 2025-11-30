# External Dependency Rule

## Overview

The `ExternalDependencyRule` enforces a whitelist of allowed external library imports within your project. This rule helps you:

- Control which third-party packages can be used in your codebase
- Enforce architectural constraints (e.g., domain layer with no external dependencies)
- Prevent unauthorized or unapproved libraries from being introduced
- Maintain consistency across different layers of your application

## Configuration

### Basic Configuration

```json
{
  "kind": "external-dependency",
  "id": "allowed-external-deps",
  "title": "Allowed External Dependencies",
  "description": "Only approved external packages can be imported",
  "allowedPackages": [
    "react",
    "express",
    "lodash"
  ]
}
```

### Layer-Specific Configuration

You can apply the rule to specific layers only:

```json
{
  "kind": "external-dependency",
  "id": "domain-no-external-deps",
  "title": "Domain Layer - No External Dependencies",
  "description": "Domain layer should not import any external libraries",
  "allowedPackages": [],
  "layer": "domain"
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kind` | string | Yes | Must be `"external-dependency"` |
| `id` | string | Yes | Unique identifier for this rule instance |
| `title` | string | Yes | Human-readable title |
| `description` | string | Yes | Description of what the rule enforces |
| `allowedPackages` | string[] | Yes | List of allowed package names |
| `layer` | string | No | If specified, only check files in this layer |

## Package Name Format

The rule automatically extracts package names from import statements:

- `react` → `react`
- `react/jsx-runtime` → `react`
- `@types/node` → `@types/node`
- `@babel/core/lib/config` → `@babel/core`

Scoped packages (starting with `@`) are treated as `@scope/package`.

## Examples

### Example 1: Pure Domain Layer

Enforce that the domain layer has no external dependencies:

```json
{
  "kind": "external-dependency",
  "id": "pure-domain",
  "title": "Pure Domain Layer",
  "description": "Domain layer must not depend on any external libraries",
  "allowedPackages": [],
  "layer": "domain"
}
```

### Example 2: Controlled Infrastructure Layer

Allow only specific database and HTTP clients in the infrastructure layer:

```json
{
  "kind": "external-dependency",
  "id": "infrastructure-deps",
  "title": "Infrastructure Dependencies",
  "description": "Infrastructure can only use approved external libraries",
  "allowedPackages": [
    "axios",
    "pg",
    "mongodb",
    "redis"
  ],
  "layer": "infrastructure"
}
```

### Example 3: Global Package Allowlist

Apply a global allowlist across all files:

```json
{
  "kind": "external-dependency",
  "id": "global-allowlist",
  "title": "Global Package Allowlist",
  "description": "Only approved packages can be used anywhere in the project",
  "allowedPackages": [
    "react",
    "react-dom",
    "express",
    "lodash",
    "date-fns",
    "zod"
  ]
}
```

## Violation Example

If a file imports a disallowed package:

```typescript
// src/domain/user.ts
import axios from 'axios'; // ❌ Not allowed in domain layer
import { v4 as uuid } from 'uuid'; // ❌ Not in allowlist
```

The rule will report:

```
Error: File imports disallowed external packages: axios, uuid
File: src/domain/user.ts
Suggestion: Only the following packages are allowed: []. Remove or replace the disallowed imports.
```

## Use Cases

1. **Clean Architecture**: Ensure domain/business logic layers don't depend on external frameworks
2. **Security Compliance**: Restrict which packages can be used to meet security requirements
3. **License Compliance**: Control package usage based on licensing requirements
4. **Performance**: Prevent heavy libraries from being used in performance-critical layers
5. **Consistency**: Enforce standard libraries across the team (e.g., use `date-fns` instead of `moment`)

## Implementation Details

The rule works by:

1. Scanning TypeScript/JavaScript files for import statements
2. Extracting external package names (non-relative imports)
3. Comparing against the allowlist
4. Reporting violations with the disallowed packages

Currently supports:
- ES6 imports: `import ... from 'package'`
- ES6 re-exports: `export ... from 'package'`
- Dynamic imports: `import('package')`
- CommonJS requires: `require('package')`

## Related Rules

- **Forbidden Layer Import**: Controls internal layer-to-layer dependencies
- **Allowed Layer Import**: Whitelists allowed internal layer imports
- **Max Dependencies**: Limits the total number of dependencies per file
