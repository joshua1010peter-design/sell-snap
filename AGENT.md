# SELL SNAP - Agent Configuration

## Project Overview

SELL SNAP is an e-commerce platform built with Next.js, React, TypeScript, and Prisma ORM. The platform connects sellers with buyers, supporting product listings, orders, payments via Flutterwave, and design token-based styling.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React with design tokens (CSS variables)
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Flutterwave
- **Validation**: Zod
- **Styling**: Design tokens from `tokens/design-tokens.css`

---

## Coding Standards

### General Rules

1. **No comments** unless explicitly requested by the user
2. **Use TypeScript** for all files (`.ts` or `.tsx`)
3. **Prefer named exports** over default exports
4. **Use path aliases**: `@/lib/...`, `@/components/...`, `@/styles/...`
5. **Never commit secrets** - use environment variables
6. **Handle errors** with `AppError` class for API routes
7. **Use design tokens** - no hardcoded colors, spacing, or typography values

### File Naming Conventions

| Type | Convention | Examples |
|------|------------|----------|
| Components | PascalCase | `ProductCard.tsx`, `LoginForm.tsx` |
| Pages/Routes | kebab-case | `product-list.tsx`, `user-settings.tsx` |
| API Routes | route.ts (kebab-case folder) | `app/api/products/route.ts` |
| Skill Files | SKILL.md | `.agent/skills/component-builder/SKILL.md` |
| Utilities | camelCase | `utils.ts`, `formatDate.ts` |
| Hooks | camelCase with use prefix | `useProducts.ts`, `useCreateOrder.ts` |
| Types | camelCase | `api.ts`, `product.ts` |

### Component Conventions

```tsx
// Always use TypeScript interfaces for props
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

// Destructure props with defaults
export function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return <button className={cn(styles[variant])} {...props}>{children}</button>;
}
```

### API Route Conventions

```ts
// Use AppError for consistent error handling
import { AppError } from '@/lib/errors';

// Response format
{ success: true, data: {...}, meta?: {...} }
{ success: false, error: '...', code: '...', details?: [...] }
```

### Database Conventions

```prisma
// Models: PascalCase singular
model Product {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations with explicit onDelete
  seller   User     @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  // Indexes for foreign keys
  @@index([sellerId])
  @@map("products")
}
```

---

## Design Token Usage

Always import and use design tokens from the tokens directory:

```tsx
import 'tokens/design-tokens.css';

// Good - uses CSS variables
<div className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">

// Bad - hardcoded values
<div style={{ backgroundColor: '#3b82f6' }}>
```

Design tokens location: `tokens/design-tokens.css`

---

## Error Handling

### API Routes

```ts
// For API routes, use AppError
throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
```

### Client Components

```tsx
// For client components, use try-catch with user feedback
try {
  await mutation.mutateAsync(data);
} catch (error) {
  toast.error('An error occurred');
}
```

---

## Import Order

1. React/Next.js imports
2. Third-party libraries
3. Absolute imports (`@/...`)
4. Relative imports (`./...`)

```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatPrice } from './utils';
```

---

## Git Conventions

- **Never commit** without explicit user request
- **No force push** unless user explicitly requests
- **Branch naming**: `feature/...`, `fix/...`, `chore/...`
- **Commit messages**: Conventional commits format (`feat:`, `fix:`, `chore:`)

---

## Available Skills

When working on SELL SNAP, use these skills based on the task:

| Skill | Trigger |
|-------|---------|
| `component-builder` | Creating UI components |
| `api-route-scaffolder` | Creating API endpoints |
| `db-migration-runner` | Database migrations |
| `flutterwave-integration` | Payment integration |

Load skills using: `skill name="<skill-name>"`

---

## Project Structure

```
SELL SNAP/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── products/
│   │   ├── orders/
│   │   └── payments/
│   ├── (routes)/                 # Page routes
│   └── layout.tsx
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── forms/                    # Form components
│   └── layouts/                  # Layout components
├── lib/                          # Utilities and configs
│   ├── db.ts                     # Prisma client
│   ├── errors.ts                 # Error handling
│   └── utils.ts                  # Utilities
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── prisma/                       # Database schema
│   ├── schema.prisma
│   └── migrations/
├── tokens/                       # Design tokens
│   ├── design-tokens.css
│   └── color-tokens.json
├── .agent/                       # Agent skills
│   └── skills/
│       ├── component-builder/
│       ├── api-route-scaffolder/
│       ├── db-migration-runner/
│       └── flutterwave-integration/
├── AGENT.md                      # This file
└── package.json
```

---

## Agent Behavior

### DO
- Follow project conventions exactly
- Use design tokens for all styling
- Add TypeScript types to all functions and components
- Handle errors appropriately (AppError for API, try-catch for client)
- Use Zod for validation in API routes
- Check related files before making changes
- Run pre-flight checks from skill files when applicable

### DON'T
- Add comments unless explicitly asked
- Use hardcoded values (colors, spacing, etc.)
- Commit changes without user permission
- Use default exports
- Skip error handling
- Expose secrets in code
- Create files outside defined project structure

---

## Verification Checklist

Before completing any task, verify:

- [ ] TypeScript types added/updated
- [ ] Design tokens used (no hardcoded values)
- [ ] Error handling implemented
- [ ] No secrets in code
- [ ] File naming follows conventions
- [ ] Imports use path aliases
- [ ] Reusable and follows single responsibility
- [ ] API routes return proper response format
- [ ] Database models have indexes on foreign keys
- [ ] Components support className prop
- [ ] Accessibility attributes added where needed
