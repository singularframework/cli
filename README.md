# Singular CLI

This package contains the command line interface (CLI) for [Singular framework](https://singularframework.com).

```bash
npm install @singular/cli -g
sg --version
sg --help
```

## Usage

The following commands serves as the CLI documentation:

```bash
sg --help
# sg <command> --help (for command-specific usage)
```

## Tests

```bash
npm test
```

## Building the Source

```bash
npm start
```

## Upgrading

Major versions of all `@singular` modules are all aligned with the framework's major. However, the minor and patch versions are independent of one another.

To safely upgrade from one major version to another, use `sg upgrade`.

To help with upgrading (using `sg upgrade`), there may be an incremental patch available with every major upgrade if necessary. The patch packages follow the name syntax `@singular/inc-patch-{{baseMajor}}-{{targetMajor}}` (e.g. `@singular/inc-patch-1-2`).
