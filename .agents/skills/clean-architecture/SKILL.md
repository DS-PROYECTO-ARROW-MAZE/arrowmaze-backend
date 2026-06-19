---
name: clean-architecture
description: Enforce Clean Architecture rules and Deep Modules design. Use when structuring code, creating new classes, or defining boundaries.
---
# Clean Architecture & Deep Modules

1. **Dependency Rule:** Inner layers MUST NOT import from outer layers. **Domain** and **Application** are framework-free zones — zero imports from NestJS, Prisma, or any infrastructure library. Only **Infrastructure** may depend on frameworks.
2. **Deep Modules:** Design modules with narrow, stable interfaces hiding complex implementations. Avoid creating many small, shallow classes. 
3. **AOP via SOLID:** Implement cross-cutting concerns (logging, metrics) using Decorators in the Application layer, not scattered throughout the Domain.