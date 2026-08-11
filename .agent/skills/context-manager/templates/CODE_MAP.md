# Codebase Organization Map

> **AGENT CONTEXT:** Where to find logic? Use this map to navigate the codebase efficiently.

## 📂 Backend Structure

| Directory         | Purpose              | Key Files                                |
| :---------------- | :------------------- | :--------------------------------------- |
| `src/controllers` | Handle HTTP requests | `UserController.ts`, `AuthController.ts` |
| `src/services`    | Business Logic       | `AuthService.ts`                         |
| `src/models`      | Database Schemas     | `User.ts`                                |

### 🧭 Where is the logic?

- **User Auth:** `src/modules/auth/`
- **Business Rules:** `src/core/rules/`
- **Data Access:** `src/infrastructure/db/`

---

## 📂 Frontend Structure

| Directory       | Purpose                | Key Files                |
| :-------------- | :--------------------- | :----------------------- |
| `components/ui` | Reusable UI Atoms      | `Button.tsx`, `Card.tsx` |
| `features/`     | Feature-specific Logic | `auth/LoginForm.tsx`     |
| `hooks/`        | Custom Hooks           | `useAuth.ts`             |

### 🧭 Key Locations

- **Design System:** `src/theme/` or `tailwind.config.js`
- **Global State:** `src/store/`
- **Routing:** `src/app/` or `src/routes/`
