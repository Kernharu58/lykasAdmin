# lykasAdmin — Branch 2.0 Documentation

> Admin dashboard for the **CarePaws** pet shelter & adoption platform.  
> Repository: [Kernharu58/lykasAdmin @ 2.0](https://github.com/Kernharu58/lykasAdmin/tree/2.0)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Environment Variables](#5-environment-variables)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Pages & Routes](#7-pages--routes)
8. [Components](#8-components)
9. [Context Providers](#9-context-providers)
10. [Hooks](#10-hooks)
11. [API Service Layer](#11-api-service-layer)
12. [User Roles & Permissions](#12-user-roles--permissions)
13. [Real-Time Features](#13-real-time-features)
14. [Architecture Notes](#14-architecture-notes)

---

## 1. Project Overview

**lykasAdmin** is the admin-facing front-end for the CarePaws shelter management system. It provides shelter administrators, staff members, and super admins with a centralized interface to manage:

- Pets in the shelter (add, edit, track status)
- Adoption applications (review and process)
- Volunteer shift scheduling
- Manual payment recording and donation tracking
- Staff account management
- Real-time chat between staff
- Audit logs (super admin only)

The front-end communicates with a hosted REST API backend (`lykasserver.onrender.com`) and uses Socket.IO for real-time messaging.

---

## 2. Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| UI Framework | React | ^19.2.4 |
| Language | TypeScript | ~6.0.2 |
| Build Tool | Vite | ^8.0.4 |
| Routing | React Router DOM | ^7.14.0 |
| Styling | Tailwind CSS | ^4.2.2 |
| HTTP Client | Axios | ^1.14.0 |
| Real-Time | Socket.IO Client | ^4.8.3 |
| Auth (OAuth) | @react-oauth/google | ^0.13.5 |
| Icons | Lucide React | ^1.7.0 |
| Linting | ESLint + TypeScript ESLint | ^9.39.4 / ^8.58.0 |
| CSS Processing | PostCSS + Autoprefixer | ^8.5.9 / ^10.4.27 |

---

## 3. Project Structure

```
lykasAdmin/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   └── lykas/
│   │       └── carePawLogo.jpg
│   ├── components/
│   │   ├── Community/
│   │   │   ├── DonationTracker.tsx
│   │   │   └── VolunteerForm.tsx
│   │   ├── adoption/
│   │   │   └── AdoptionForm.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pets/
│   │   │   ├── AddPetModal.tsx
│   │   │   ├── EditPetModal.tsx
│   │   │   ├── PetCard.tsx
│   │   │   └── PetFilter.tsx
│   │   ├── shifts/
│   │   │   ├── AddShiftModal.tsx
│   │   │   └── EditShiftModal.tsx
│   │   ├── ui/
│   │   │   ├── Alert.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── FormUI.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── SharedUI.tsx
│   │   │   ├── StateDisplays.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── TextArea.tsx
│   │   └── ErrorBoundary.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/
│   │   ├── useApplications.ts
│   │   └── usePets.ts
│   ├── pages/
│   │   ├── Accounts.tsx
│   │   ├── AdoptionForm.tsx
│   │   ├── Adoptions.tsx
│   │   ├── AuditLogs.tsx
│   │   ├── Chat.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Donations.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── ManagePets.tsx
│   │   ├── PetDetails.tsx
│   │   ├── PetGallery.tsx
│   │   ├── PetManagement.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── Settings.tsx
│   │   ├── Shifts.tsx
│   │   ├── StaffManagement.tsx
│   │   ├── VerifyEmail.tsx
│   │   └── Volunteer.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── auth.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.cjs
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 4. Getting Started

### Prerequisites

- Node.js 18 or later
- npm or pnpm

### Installation

```bash
# Clone the repository and switch to branch 2.0
git clone https://github.com/Kernharu58/lykasAdmin.git
cd lykasAdmin
git checkout 2.0

# Install dependencies
npm install
```

### Running in Development

```bash
npm run dev
```

The app starts at `http://localhost:5173` by default (Vite default port).

### Building for Production

```bash
npm run build
```

Output goes to `dist/`.

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 5. Environment Variables

Create a `.env` file at the project root. The following variables are required:

| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_URL` | Base URL for the backend REST API | `https://lykasserver.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID for Google Sign-In | `528938082763-...apps.googleusercontent.com` |

> **Note:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the client bundle.

---

## 6. Authentication & Authorization

### Token Storage

Authentication state is managed with JWT tokens stored in `localStorage` under the key `adminToken`. On every app load, the token is validated against the `/auth/me` endpoint. If invalid or expired, the user is logged out automatically.

### Login Methods

- **Email + Password** — standard credential login
- **Google OAuth** — via `@react-oauth/google`, wraps the entire app with `<GoogleOAuthProvider>`

### Session Verification Flow

```
App Mount
  └─> AuthContext reads localStorage("adminToken")
        ├─ Token exists → GET /auth/me
        │     ├─ Success → set user state
        │     └─ Failure → logout() + clear storage
        └─ No token → unauthenticated state
```

### Logout

Logout calls `POST /auth/logout` to blacklist the token server-side, then clears `adminToken` and `originalAdminToken` from localStorage.

### User Impersonation

Super admins can impersonate other accounts:

- `startImpersonation(token, user)` — saves the original token to `originalAdminToken` in localStorage, then switches active session to the target user.
- `stopImpersonation()` — restores the original token and re-fetches the original user's profile from `/auth/me`.

### Global 401 Handling

The Axios instance includes a response interceptor that fires a custom DOM event (`admin:unauthorized`) whenever a `401` response is received. `AuthContext` listens for this event and triggers `logout()`.

### Password Management

- `POST /auth/admin/force-reset/:userId` — admin-initiated password reset email for a given user (exported as `sendUserPasswordReset`).
- Standard self-service forgot/reset password pages are also available at `/forgot-password` and `/reset-password`.

---

## 7. Pages & Routes

### Public Routes (no auth required)

| Path | Component | Purpose |
|---|---|---|
| `/login` | `Login` | Credential login + Google OAuth |
| `/verify-email` | `VerifyEmail` | Post-registration email verification |
| `/forgot-password` | `ForgotPassword` | Request a password reset link |
| `/reset-password` | `ResetPassword` | Set a new password via reset token |

### Protected Routes (all authenticated roles)

All routes below are wrapped in `<ProtectedRoute allowedRoles={['admin', 'staff', 'super_admin']}>` and rendered inside `AdminLayout`.

| Path | Component | Purpose |
|---|---|---|
| `/` | `Dashboard` | Overview: available pets, pending adoptions, active volunteer count |
| `/adoptions` | `Adoptions` | List and process adoption applications |
| `/pets` | `ManagePets` | Full CRUD for shelter pets |
| `/shifts` | `Shifts` | Volunteer shift scheduling and management |
| `/chat` | `Chat` | Real-time staff messaging (Socket.IO) |
| `/manual-payments` | `ManualPayments` | Manual payment recording and donation tracking |
| `/settings` | `Settings` | User and system settings |

### Admin-Only Routes

| Path | Component | Allowed Roles |
|---|---|---|
| `/accounts` | `Accounts` | `admin`, `super_admin` |
| `/identity-verifications` | `UserVerification` | `admin`, `super_admin` |
| `/audit-logs` | `AuditLogs` | `super_admin` only |

Any unmatched route redirects to `/` via `<Navigate to="/" replace />`.

---

## 8. Components

### Layout Components

#### `Sidebar`
The main navigation sidebar. On large screens (`lg`) it is always visible, pinned at `w-64`. On smaller screens it is an overlay toggled by a hamburger menu button in the top bar.

#### `Navbar`
Mobile-only top bar. Displays the app name ("CarePaws Admin") and the sidebar toggle button.

#### `ProtectedRoute`
A wrapper component that reads `allowedRoles` and checks the current user's role from `AuthContext`. Redirects unauthenticated users to `/login` and unauthorized roles to `/` (dashboard).

#### `ErrorBoundary`
A React class component error boundary that catches unhandled render errors and displays a fallback UI instead of crashing the entire app.

### Pet Components

| Component | Description |
|---|---|
| `PetCard` | Card-based display of a single pet's key info and status |
| `PetFilter` | Filter controls for the pet list (by species, status, etc.) |
| `AddPetModal` | Modal form to add a new pet to the shelter |
| `EditPetModal` | Modal form to edit an existing pet's details |

### Shift Components

| Component | Description |
|---|---|
| `AddShiftModal` | Modal form to create a new volunteer shift |
| `EditShiftModal` | Modal form to update an existing shift |

### Community Components

| Component | Description |
|---|---|
| `ManualPaymentTracker` | Records and displays manually entered donation/payment entries |
| `VolunteerForm` | Form for volunteer sign-up or management |
| `AdoptionForm` | Form for submitting or reviewing an adoption application |

### UI Primitives (`src/components/ui/`)

| Component | Description |
|---|---|
| `Button` | Reusable button with variants |
| `Alert` | Inline alert/notification display |
| `Modal` | Generic modal wrapper |
| `ConfirmModal` | Modal with confirm/cancel actions for destructive operations |
| `FormUI` | Shared form field layouts and label wrappers |
| `TextArea` | Styled textarea input |
| `StatusBadge` | Color-coded badge for statuses (Available, Pending, Adopted, etc.) |
| `StateDisplays` | Loading, error, and empty state display components |
| `SharedUI` | Common layout primitives: `PageHeader`, `Card`, etc. |

---

## 9. Context Providers

### `AuthContext`

**File:** `src/context/AuthContext.tsx`

Provides global authentication state. Wrap your component tree with `<AuthProvider>`.

**Exposed values:**

| Value | Type | Description |
|---|---|---|
| `user` | `User \| null` | Currently authenticated user object |
| `token` | `string \| null` | Current JWT token |
| `isLoading` | `boolean` | True while session verification is in progress |
| `isAuthenticated` | `boolean` | Shorthand: `!!token` |
| `isImpersonating` | `boolean` | True when an original token is stored (impersonation active) |
| `login(token, user)` | Function | Store token and set user state |
| `logout()` | Function | Blacklist token server-side and clear local state |
| `startImpersonation(token, user)` | Function | Begin a super admin impersonation session |
| `stopImpersonation()` | Function | Exit impersonation and restore original session |

**Hook:** `useAuth()` — throws if used outside `<AuthProvider>`.

### `ToastContext`

**File:** `src/context/ToastContext.tsx`

Provides a global toast notification system. Wrap your component tree with `<ToastProvider>`.

---

## 10. Hooks

### `usePets`

**File:** `src/hooks/usePets.ts`

Custom hook for fetching and managing the shelter's pet list from the API.

### `useApplications`

**File:** `src/hooks/useApplications.ts`

Custom hook for fetching and managing adoption applications from the API.

---

## 11. API Service Layer

**File:** `src/services/api.ts`

A pre-configured Axios instance that all API calls in the app should use.

### Base URL

Reads from `VITE_API_URL` environment variable. Falls back to `https://lykasserver.onrender.com/api`.

### Request Interceptor

Automatically attaches the JWT token from `localStorage("adminToken")` as a `Bearer` token in the `Authorization` header for every outgoing request.

### Response Interceptor

Catches `401 Unauthorized` responses globally and dispatches the `admin:unauthorized` custom event, which `AuthContext` listens to in order to trigger automatic logout.

### Named Exports

| Export | Endpoint | Description |
|---|---|---|
| `sendUserPasswordReset(userId)` | `POST /auth/admin/force-reset/:userId` | Admin-triggered password reset email for a specific user |
| `default` (api) | — | The pre-configured Axios instance |

---

## 12. User Roles & Permissions

The platform uses four roles with progressively expanding permissions:

| Role | Description | Key Permissions |
|---|---|---|
| `user` | Public-facing user (not used in admin panel) | No admin access |
| `staff` | Shelter staff member | Access to dashboard, pets, shifts, chat, manual payments, adoptions, settings |
| `admin` | Shelter administrator | All staff permissions + account management (`/accounts`) + identity verification review (`/identity-verifications`) |
| `super_admin` | Platform super administrator | All admin permissions + audit logs (`/audit-logs`) + user impersonation |

### User Status

A user account can carry one of three statuses:

| Status | Meaning |
|---|---|
| `active` | Normal, functioning account |
| `suspended` | Temporarily disabled by an admin |
| `locked` | Locked due to too many failed login attempts or policy violation |

---

## 13. Real-Time Features

The app uses **Socket.IO Client** (`socket.io-client ^4.8.3`) to power the real-time chat page (`/chat`). Staff members can communicate with each other in real time through the `Chat` component.

The Socket.IO connection connects to the same backend server defined by `VITE_API_URL`.

---

## 14. Manual Payment Recording & Identity Verification

### Manual Payment Recording ()

The **ManualPayments** page replaces the old Donations page. Because CarePaws does not process online payments, all donations are recorded manually by staff after receiving them in person, via GCash, or via bank transfer.

**Fields per record:**

| Field | Description |
|---|---|
| Donor Name | Name of the person who donated |
| Amount (PHP) | Peso amount received |
| Payment Method | `cash`, `bank_transfer`, `gcash`, `other` |
| Reference Number | Bank or e-wallet transaction reference |
| Date Received | Date the payment was physically received |
| Notes | Optional free-text notes |
| Recorded By | Auto-filled with the logged-in staff member |

Staff can add, edit, and delete records. Records are visible to all staff and admin roles.

---

### User Identity Verification ()

The **UserVerification** page allows admin and super admin to review identity submissions from mobile app users.

**Review workflow:**

1. User submits government ID via the mobile app.
2. Record appears in the admin panel with status **Pending**.
3. Admin reviews uploaded images (ID front, back, optional selfie).
4. Admin clicks **Approve** or **Reject** (rejection requires a reason).
5. User is notified by email and their profile badge updates accordingly.

**Verification statuses:**

| Status | Meaning |
|---|---|
|  | User has never submitted an ID |
|  | Submission awaiting admin review |
|  | Identity confirmed — user may submit adoption applications |
|  | Submission rejected; user may resubmit with a corrected document |

> Users trigger this from the `verify-identity` screen in the mobile app. The admin panel receives and processes these submissions.
>
> **Privacy note:** Uploaded ID images are stored in a restricted Cloudinary folder () and are accessible only to admin roles via signed URLs.

---

## 14. Architecture Notes

- **Contract-first approach:** The backend REST API is the source of truth. The front-end is a pure consumer — no server-side rendering, no data mutations happen without going through the API.
- **Token-based auth in localStorage:** JWTs are stored in `localStorage` rather than `httpOnly` cookies. This simplifies the client-side implementation but means XSS protection (CSP headers, input sanitization) is important on the backend.
- **Impersonation via dual tokens:** The impersonation feature stores the original admin token in `localStorage("originalAdminToken")` alongside the impersonated session token in `localStorage("adminToken")`. Stopping impersonation restores the original.
- **Identity verification is dual-gated:** The `identityVerified` flag on the User model is set server-side by an admin. The mobile app reads it from `/auth/me` and the admin panel uses it to unlock adoption application review.
- **Role enforcement is dual-layer:** `ProtectedRoute` enforces roles client-side; the backend must also enforce them server-side for true security.
- **Google OAuth is optional:** The app falls back gracefully if `VITE_GOOGLE_CLIENT_ID` is an empty string — the `GoogleOAuthProvider` wraps the app regardless, but the Google button will simply not function.
- **Responsive layout:** The admin shell uses a fixed `lg:w-64` sidebar on desktop and a slide-in overlay sidebar on mobile, managed with local `useState` in `AdminLayout`.
- **TypeScript strict mode:** The project uses multiple `tsconfig` files (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`) consistent with Vite's recommended TypeScript setup.

---

*Documentation generated for branch `2.0` — May 2026.*
