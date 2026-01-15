# Track: Platform Administration (Module AI Config)

**Status:** IN PROGRESS
**Started:** 2026-01-15

## Context
This track implements administrative controls for AI configuration at the module level. It allows module developers (or admins) to specify API keys and model preferences for individual modules, decentralizing resource management and enabling multi-provider support in the future.

## Goals
1.  Establish a database schema for module-specific AI settings.
2.  Create an Admin UI for managing these settings securely.
3.  Update the AI Gateway (`providerResolver`) to respect the module-level configuration hierarchy.

## Resources
- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
