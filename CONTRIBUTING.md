# Contributing to Reframe

Thank you for your interest in contributing to Reframe! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/reframe.git`
3. Install dependencies: `bun install`
4. Start development server: `bun run dev`

## Development

- Use `bun` as the package manager
- Run `bun run lint` before committing
- Run `bunx tsc --noEmit` to check types

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure CI passes
4. Submit a pull request with a clear description

## Code Style

- Use TypeScript
- Follow existing code patterns
- Use CSS variables for theming (not hard-coded colors)
- Use the `cn()` utility for class names

## Reporting Issues

- Use the provided issue templates
- Include reproduction steps
- Include browser/OS information

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
