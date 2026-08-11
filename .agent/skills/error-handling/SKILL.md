---
name: error-handling
description: Master error handling patterns across languages including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, debugging issues, or improving application reliability.
---

# Error Handling Patterns

Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences.

## When to Use This Skill

- Implementing error handling in new features.
- Designing error-resilient APIs.
- Debugging production issues.
- Improving application reliability.
- Creating better error messages for users and developers.

## Workflow

1.  **Identify Failure Modes**: Determine if errors are recoverable (network, validation) or unrecoverable (System/OOM).
2.  **Select Pattern**: Choose the appropriate pattern (Exception, Result, Circuit Breaker) based on language and context.
3.  **Implement**: Apply the pattern using the guidelines below.
4.  **Validate**: Ensure graceful degradation and meaningful logging.

## Core Concepts

### 1. Error Handling Philosophies

- **Exceptions**: Unexpected errors, exceptional conditions. Disrupts control flow.
- **Result Types**: Expected errors, validation failures. Explicit functional approach.
- **Panics/Crashes**: Unrecoverable errors, programming bugs.

### 2. Error Categories

- **Recoverable**: Network timeouts, missing files, invalid user input, API rate limits.
- **Unrecoverable**: Out of memory, stack overflow, programming bugs.

## Best Practices

1.  **Fail Fast**: Validate input early.
2.  **Preserve Context**: Include stack traces and metadata.
3.  **Meaningful Messages**: Explain _what_ happened.
4.  **Log Appropriately**: Don't spam logs for expected failures.
5.  **Clean Up**: Use `finally` / `defer` / context managers.
