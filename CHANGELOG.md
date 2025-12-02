# Changelog

All notable changes to Archctl will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- N/A

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [0.2.0] - 2024-12-01

### Added
- Interactive HTML report generation with `--format html` option
- Architecture health score visualization
- Interactive dependency graphs in HTML reports
- Layer interaction matrices
- Top dependencies and most imported files analytics
- DDD Microservices architecture template
- Modular Monolith architecture template
- Enhanced violation details with actionable suggestions
- Improved error messages and user feedback

### Changed
- Enhanced CLI output formatting with better colors and structure
- Improved graph visualization capabilities
- Better handling of complex dependency chains

### Fixed
- Various bug fixes and performance improvements

## [0.1.0] - 2024-11-30

### Added
- Initial release
- Core CLI commands: `init`, `lint`, `graph`, `layers`, `rules`
- Architecture templates: Clean Architecture, Hexagonal Architecture
- Rule implementations:
  - `allowed-layer-import` - Whitelist layer dependencies
  - `forbidden-layer-import` - Blacklist layer dependencies
  - `max-dependencies` - Limit file dependencies
  - `cyclic-dependency` - Detect circular dependencies
  - `external-dependency` - Control external package usage
  - `file-pattern-layer` - Enforce file location by pattern
- Multi-language support: TypeScript, JavaScript, Python, Java
- Dependency graph visualization
- JSON output format for CI/CD integration
- VS Code extension with real-time diagnostics
- Comprehensive documentation

---

## Release Notes Format

### Added
New features and capabilities

### Changed
Changes to existing functionality

### Deprecated
Features that will be removed in future versions

### Removed
Features that have been removed

### Fixed
Bug fixes

### Security
Security-related changes
