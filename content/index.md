---
title: Component & Style Preview
description: Preview page showcasing UI components, prose elements, and MDC syntax.
---

# Component & Style Preview

This page demonstrates how various elements render with the current theme.

---

## Prose Elements

### Text Formatting

  This is a paragraph with **bold text**, *italic text*, and `inline code`. You can also use ~~strikethrough~~ text.

  > **Note:** This is a blockquote. It's useful for calling out important information in your documentation.

### Lists

  **Unordered list:**
  - Authentication & authorization
  - Rate limiting and throttling
  - Input validation and sanitization
  - CORS configuration

  **Ordered list:**
  1. Clone the repository
  2. Install dependencies with `npm install`
  3. Configure environment variables
  4. Start the development server

  **Task list:**
  - [x] Project initialization
  - [x] Database schema design
  - [ ] API endpoints
  - [ ] Frontend integration

### Table

  | Feature | Status | Priority |
  |---------|--------|----------|
  | OAuth 2.0 |  Complete | High |
  | MFA Support |  In Progress | High |
  | API Keys | Planned | Medium |
  | Webhooks | Planned | Low |

### Code Blocks

  Inline code: `const apiKey: string = process.env.API_KEY`

```typescript
import { defineEventHandler, createError } from 'h3'
import type { AuthSession } from '~/types/auth'

export default defineEventHandler(async (event): Promise<AuthSession> => {
  const session = await getSession(event)

  if (!session?.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return session
})
```

```yaml
# docker-compose.yml
services:
  api:
    image: node:22-alpine
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/app
```

```diff
- const token = jwt.sign(payload, 'hardcoded-secret')
+ const token = jwt.sign(payload, process.env.JWT_SECRET)
```

---

## MDC Components

### Alerts

::alert{type="info"}
**Info:** This is an informational alert using the Alert component.
::

::alert{type="warning"}
**Warning:** Be careful when modifying authentication middleware.
::

### Counter

::counter
::

---

## Nuxt UI Components

### Buttons

  :u-button{label="Primary" color="primary"}

  :u-button{label="Neutral" color="neutral" variant="outline"}

  :u-button{label="Ghost" color="neutral" variant="ghost"}

### Badges

  :u-badge{label="Stable" color="success"}

  :u-badge{label="Beta" color="warning"}

  :u-badge{label="Deprecated" color="error"}

  :u-badge{label="v2.1.0" color="neutral" variant="outline"}

### Card

::u-card
---
title: Authentication Setup
---
  Configure your authentication provider by setting the required environment variables. The system supports OAuth 2.0 with PKCE flow for maximum security.
::

---

*Last updated: March 2026*
