# System Roles & Permissions Documentation

> **CRITICAL FOR AI:** Read this file before attempting to fix permissions, roles, or access control issues.

## 1. Definitive Role List (Source of Truth)

| Role Name | Description        | ID / Enum |
| :-------- | :----------------- | :-------- |
| `admin`   | Full System Access | 1         |
| `user`    | Standard User      | 2         |
| `editor`  | Can edit content   | 3         |

## 2. Permissions Matrix

| Permission       | Admin | User | Editor |
| :--------------- | :---: | :--: | :----: |
| `create_post`    |  ✅   |  ❌  |   ✅   |
| `delete_user`    |  ✅   |  ❌  |   ❌   |
| `view_dashboard` |  ✅   |  ✅  |   ✅   |

## 3. Implementation Details

- **Database Column:** `users.role` (String)
- **Middleware:** `authMiddleware.ts` checks token claims.
- **Frontend Guard:** `<AuthGuard allowedRoles={['admin']} />`
