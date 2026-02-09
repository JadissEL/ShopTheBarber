# Architecture: Full-stack, unified development only

This document states the **critical project rule** for how features are built in this codebase.

## Core rule

**Any feature, change, or improvement must be handled as a complete, end-to-end system.**

Work on frontend, backend, database, or UX **in isolation is not allowed**. This applies to all future tasks, without exception.

## What “complete feature” means (MANDATORY)

Every feature must address **all** of the following layers.

### 1. Frontend (UI)

- Visual layout
- Responsiveness (desktop-first web platform rule applies)
- Component structure
- States: loading, empty, error, success

### 2. UX (user experience)

- User flow: start → action → result
- Feedback: toasts, modals, confirmations
- Accessibility and clarity
- Consistency with existing patterns

No feature is complete without a clear, intuitive user journey.

### 3. Backend (logic and API)

- API endpoints or server actions
- Validation and error handling
- Authorization and permissions
- Performance considerations

Backend must match frontend behavior exactly.

### 4. Database and relationships

- Data models / schemas
- Relationships (1-to-1, 1-to-many, many-to-many)
- Constraints and integrity rules
- Scalability and future use

No “temporary” or hardcoded-only data for real features. Use real data and schema.

### 5. System uniformity

Every feature must:

- Match existing naming conventions
- Reuse existing patterns and components
- Follow the same architectural style
- Feel like it was built at the same time as the rest of the platform

Nothing should feel bolted on.

## Required workflow for every task

1. Understand the feature’s role in the platform  
2. Design the UX flow  
3. Design the frontend structure  
4. Define backend logic  
5. Define database schema and relationships  
6. Ensure consistency with the rest of the system  
7. Verify desktop-first behavior  

If any layer is missing, the task is **incomplete**.

## Not allowed

- Frontend-only implementations  
- UI without backend logic  
- Backend endpoints without UI usage  
- Database changes without UI impact  
- One-off styles or patterns  
- Features that break visual or logical consistency  

## Self-validation checklist (before finishing any task)

- Does this feature feel native to the platform?  
- Does it respect the desktop-first web platform rule?  
- Are UI, UX, backend, and database fully aligned?  
- Could another developer extend this feature easily?  
- Does this maintain long-term scalability?  

If not → revise.

## Acknowledgment

Before continuing any future task: **“This feature must be delivered as a complete, unified, full-stack system.”**

All future work must comply with this rule automatically.

## Related

- Desktop-first: [docs/ARCHITECTURE_DESKTOP_FIRST.md](ARCHITECTURE_DESKTOP_FIRST.md), [docs/RESPONSIVE_LAYOUT.md](RESPONSIVE_LAYOUT.md)
- Cursor rule: `.cursor/rules/full-stack-unified-development.mdc`
