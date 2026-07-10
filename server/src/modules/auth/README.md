# Portable Authentication Module

A production-ready, reusable, and portable Authentication Module for a Node.js + Express.js backend. It implements standard secure cookie-based JWT authentication, Redis-based token blacklisting on logout, Role-Based Access Control (RBAC), input validation, rate limiting, and soft delete functionality.

---

## Features

- **Authentication**: Registration, login, and secure logout.
- **Cookie-Based Security**: Automatic secure HTTP-only cookie setting and clearing.
- **JWT & Redis Blacklist**: Short-term JWT tokens blacklisted on logout in Redis for the exact remaining TTL.
- **Role-Based Access Control (RBAC)**: Extensible system supporting `USER` and `ADMIN` roles.
- **User Profile Management**: Update details, password rotation, and self soft-deletion.
- **Soft Delete**: Accounts are deactivated rather than physically deleted. Logins are automatically blocked for deleted users.
- **Drizzle Schema Centralization**: Schemas separate from queries, configured under a single database registry.
- **Rate Limiting**: Built-in sliding window rate-limiter for endpoints using Redis with a graceful memory/bypass fallback.
- **Input Validation**: Rigid input validation schemas using `express-validator`.
- **Global Error Handling**: Integration-friendly app error structure with mapping of DB/runtime errors to standard responses.

---

## Tech Stack

- **Node.js** & **Express.js**
- **PostgreSQL** with **Drizzle ORM** & **Drizzle Kit**
- **Redis** (`ioredis`) for token blacklisting & rate limiting
- **JWT** (`jsonwebtoken`) for stateless session tracking
- **Bcryptjs** (`bcryptjs`) for password hashing
- **Jest** & **Supertest** for testing

---

## Directory Structure

```txt
server/
├── drizzle/                      # Drizzle generated migration files
├── src/
│   ├── config/
│   │   ├── cache.js              # Redis configuration
│   │   ├── database.js           # Drizzle pool configuration
│   │   └── envConfig.js          # Environment variables and options
│   ├── db/
│   │   ├── schema/
│   │   │   ├── schema.js         # Central schema registry
│   │   │   └── users.schema.js   # Users table definition
│   │   └── query/
│   │       └── users.query.db.js # User query helpers (soft delete filtered)
│   ├── modules/
│   │   └── auth/
│   │       ├── constants/
│   │       │   └── roles.js      # UserRole definition
│   │       ├── controllers/
│   │       │   ├── auth.controller.js
│   │       │   └── user.controller.js
│   │       ├── middleware/
│   │       │   ├── auth.middleware.js # protect, restrictTo, rateLimiter
│   │       │   └── errorHandler.js    # Global error handler middleware
│   │       ├── routes/
│   │       │   └── auth.routes.js     # Router registry
│   │       ├── services/
│   │       │   ├── auth.service.js
│   │       │   └── user.service.js
│   │       ├── utils/
│   │       │   ├── appError.js        # Custom error boundary
│   │       │   └── jwt.js             # Token sign/verify helper
│   │       ├── validators/
│   │       │   └── auth.validator.js  # Validation schemas
│   │       ├── tests/
│   │       │   ├── auth.test.js       # Integration tests
│   │       │   ├── setup.js           # Test DB truncations & hook closers
│   │       │   └── dotenv-setup.js    # Pre-loading env vars for tests
│   │       └── index.js               # Module entry point exports
│   └── utils/
│       └── response.utlis.js     # Unified response wrappers
```

---

## API Documentation

All routes are prefixed with `/api/auth`.

### Public Endpoints

#### `POST /api/auth/register`
Registers a new user and logs them in.
- **Request Body**:
  ```json
  {
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "password": "strongpassword"
  }
  ```
- **Response (201 Created)**:
  - Sets HTTP-Only Cookie: `token`
  ```json
  {
      "success": true,
      "message": "User registered successfully",
      "data": {
          "user": {
              "id": "uuid-v4-string",
              "name": "Jane Doe",
              "email": "jane.doe@example.com",
              "role": "USER",
              "isActive": true,
              "emailVerified": false,
              "createdAt": "timestamp",
              "updatedAt": "timestamp"
          }
      }
  }
  ```

#### `POST /api/auth/login`
Authenticates user and returns access token in cookie.
- **Request Body**:
  ```json
  {
      "email": "jane.doe@example.com",
      "password": "strongpassword"
  }
  ```
- **Response (200 OK)**:
  - Sets HTTP-Only Cookie: `token`
  - Body structure matches registration.

#### `POST /api/auth/logout`
Logs out current user and blacklists their token in Redis.
- **Response (200 OK)**:
  - Clears Cookie: `token`
  ```json
  {
      "success": true,
      "message": "User logged out successfully"
  }
  ```

---

### Authenticated Endpoints (Requires valid cookie `token`)

#### `GET /api/auth/me`
Retrieves current authenticated user's profile.
- **Response (200 OK)**:
  - Body structure matches registration.

#### `PATCH /api/auth/profile`
Updates current user's profile information.
- **Request Body**:
  ```json
  {
      "name": "Jane Updated",
      "email": "jane.updated@example.com"
  }
  ```
- **Response (200 OK)**:
  - Body returns updated user details.

#### `PATCH /api/auth/change-password`
Changes current user's password.
- **Request Body**:
  ```json
  {
      "currentPassword": "strongpassword",
      "newPassword": "newstrongpassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
      "success": true,
      "message": "Password changed successfully"
  }
  ```

#### `DELETE /api/auth/account`
Allows a user to self-soft-delete their own account.
- **Response (200 OK)**:
  - Clears Cookie: `token`
  ```json
  {
      "success": true,
      "message": "Account deleted successfully"
  }
  ```

---

### Admin Endpoints (Requires valid cookie `token` and role `ADMIN`)

#### `GET /api/auth/users`
Lists all users.
- **Query Parameters**:
  - `includeDeleted=true` (Optional: Include soft-deleted users)
- **Response (200 OK)**:
  ```json
  {
      "success": true,
      "message": "Users retrieved successfully",
      "data": {
          "users": [
              {
                  "id": "uuid",
                  "name": "Jane Doe",
                  "email": "jane.doe@example.com",
                  "role": "USER",
                  "isActive": true,
                  "isDeleted": false,
                  "deletedAt": null,
                  "emailVerified": false,
                  "createdAt": "timestamp",
                  "updatedAt": "timestamp"
              }
          ]
      }
  }
  ```

#### `GET /api/auth/users/:id`
Retrieves specific user detail (including deleted state).
- **Response (200 OK)**:
  - Body returns user details including `isDeleted` and `deletedAt`.

#### `PATCH /api/auth/users/:id/role`
Updates role of target user.
- **Request Body**:
  ```json
  {
      "role": "ADMIN"
  }
  ```
- **Response (200 OK)**:
  - Returns updated user details.

#### `DELETE /api/auth/users/:id`
Admin soft-deletes target user.
- **Response (200 OK)**:
  ```json
  {
      "success": true,
      "message": "User soft-deleted successfully"
  }
  ```

---

## Installation & Setup Guide

1. **Install devDependencies**:
   Ensure you run npm installs for testing/database configuration:
   ```bash
   npm install --save-dev jest supertest drizzle-kit
   ```

2. **Configure Database**:
   Set `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, and `JWT_SECRET` in your `.env` file (refer to `.env.example`).

3. **Generate & Run Migrations**:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Run Integration Tests**:
   ```bash
   npm run test:auth
   ```

---

## Reusability / Portability Guide

To copy this module into a new Express project:

1. **Copy Module Files**:
   - Copy `src/modules/auth/` directly into your project's modules directory.
   - Copy `src/db/schema/users.schema.js` and `src/db/schema/schema.js` to your database schema directory.
   - Copy `src/db/query/users.query.db.js` into your query directory.
   - Make sure `src/utils/response.utlis.js` contains `sendResponse`, `setTokenCookie`, and `sendTokenResponse` functions.

2. **Register Schemas**:
   Add `users.schema.js` to your central Drizzle schema file (`src/db/schema/schema.js`) and configure `drizzle.config.js` to look there.

3. **Mount Router & Error Handler**:
   In your root `app.js` file:
   ```javascript
   import { authRouter } from './modules/auth/index.js';
   import { errorHandler } from './modules/auth/middleware/errorHandler.js';

   // ... other middlewares
   app.use('/api/auth', authRouter);

   // Centralized Global Error Handler (must be last)
   app.use(errorHandler);
   ```

4. **Verify Variables**:
   Ensure the following environment variables are loaded and validated in your configuration setup:
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
   - `CLIENT_ORIGINS` (used in CORS)
