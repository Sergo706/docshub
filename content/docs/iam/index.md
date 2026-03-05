---
title: IAM Service
description: Identity and Access Management module documentation.
---

# Identity and Access Management

The IAM Service provides granular role-based access control (RBAC) and attribute-based access control (ABAC) for all Riavzon ecosystem applications.

## Core Concepts

Understanding how permissions are structured is vital for correctly configuring the IAM service.

### Roles and Policies

A **Role** is a collection of attached **Policies**. A Policy defines explicitly what actions are permitted or denied on specific resources.

    ::card
    ## `admin` Role
    Full access to all dashboard components and user management systems.
    ::

    ::card
    ## `editor` Role
    Can create and manage content, but cannot alter global configuration or schemas.
    ::

    ::card
    ## `viewer` Role
    Read-only access to specific resources defined by attribute tags.
    ::

> [!CAUTION]
> Avoid granting `*` (wildcard) permissions unless specifically configuring the root superuser role.

## API Integration

To enforce policies within your GraphQL or REST endpoints, wrap your resolvers or event handlers with the `defineIAMGuard` utility.

```typescript [server/api/admin/users.get.ts]
export default defineEventHandler(async (event) => {
  // Requires the exact 'admin' role or the 'users:list' specific permission
  await defineIAMGuard(event, ['admin', 'users:list'])

  return await db.query.users.findMany()
})
```
